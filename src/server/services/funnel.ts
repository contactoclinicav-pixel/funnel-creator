import "server-only";

import { randomUUID } from "crypto";

import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";
import type { FunnelStatus } from "@/generated/prisma/enums";

interface Ctx {
  userId: string;
  workspaceId: string;
}

/** Genera un slug único global a partir de un nombre; sufija -2, -3… si colisiona. */
export async function generateUniqueSlug(
  name: string,
  excludeFunnelId?: string
): Promise<string> {
  const base = slugify(name) || "funnel";
  let candidate = base;
  for (let i = 2; ; i++) {
    const existing = await prisma.funnel.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === excludeFunnelId) {
      return candidate;
    }
    candidate = `${base}-${i}`;
  }
}

const DEFAULT_INTRO = {
  headline: "Descubre lo que necesitas en 2 minutos",
  subheadline: "Responde unas preguntas rápidas y recibe una recomendación personalizada.",
  buttonText: "Empezar",
};

const DEFAULT_THEME = {
  primaryColor: "#171717",
  backgroundColor: "#ffffff",
  font: "geist",
};

const DEFAULT_LEAD_CAPTURE = {
  position: "before_result",
  fields: [
    { key: "name", label: "Nombre", enabled: true, required: true },
    { key: "email", label: "Email", enabled: true, required: true },
    { key: "phone", label: "Teléfono", enabled: false, required: false },
    { key: "city", label: "Ciudad", enabled: false, required: false },
  ],
  consent: {
    enabled: true,
    text: "Acepto recibir información sobre este servicio.",
  },
};

const DEFAULT_CTA = {
  type: "url",
  label: "Más información",
  value: "",
};

export async function createFunnel(
  ctx: Ctx,
  data: { name: string; goal?: string; industry?: string; audience?: string }
) {
  const slug = await generateUniqueSlug(data.name);
  return prisma.funnel.create({
    data: {
      workspaceId: ctx.workspaceId,
      createdBy: ctx.userId,
      name: data.name,
      slug,
      goal: data.goal,
      industry: data.industry,
      audience: data.audience,
      intro: DEFAULT_INTRO,
      theme: DEFAULT_THEME,
      leadCapture: DEFAULT_LEAD_CAPTURE,
      cta: DEFAULT_CTA,
    },
  });
}

export async function listFunnels(ctx: Ctx, filter?: { status?: FunnelStatus }) {
  return prisma.funnel.findMany({
    where: {
      workspaceId: ctx.workspaceId,
      ...(filter?.status ? { status: filter.status } : {}),
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      goal: true,
      updatedAt: true,
      _count: { select: { leads: true, sessions: true, questions: true } },
    },
  });
}

export async function getFunnel(ctx: Ctx, funnelId: string) {
  return prisma.funnel.findFirst({
    where: { id: funnelId, workspaceId: ctx.workspaceId },
  });
}

export async function updateFunnelSettings(
  ctx: Ctx,
  funnelId: string,
  data: {
    name?: string;
    slug?: string;
    goal?: string | null;
    industry?: string | null;
    audience?: string | null;
  }
) {
  const funnel = await getFunnel(ctx, funnelId);
  if (!funnel) {
    return { error: "Funnel no encontrado." as const };
  }

  if (data.slug && data.slug !== funnel.slug) {
    const taken = await prisma.funnel.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });
    if (taken && taken.id !== funnelId) {
      return { error: "Esa URL ya está en uso. Elige otra." as const };
    }
  }

  const updated = await prisma.funnel.update({
    where: { id: funnelId },
    data,
  });
  return { funnel: updated };
}

export async function setFunnelStatus(
  ctx: Ctx,
  funnelId: string,
  status: Extract<FunnelStatus, "DRAFT" | "ARCHIVED">
) {
  const funnel = await getFunnel(ctx, funnelId);
  if (!funnel) {
    return { error: "Funnel no encontrado." as const };
  }
  const updated = await prisma.funnel.update({
    where: { id: funnelId },
    data: { status },
  });
  return { funnel: updated };
}

/**
 * Copia profunda de un funnel: preguntas, opciones, reglas de lógica y
 * perfiles, remapeando todas las referencias internas a los nuevos ids.
 * No copia sesiones, leads, eventos ni versiones publicadas.
 */
export async function duplicateFunnel(ctx: Ctx, funnelId: string) {
  const source = await prisma.funnel.findFirst({
    where: { id: funnelId, workspaceId: ctx.workspaceId },
    include: {
      questions: { include: { options: true }, orderBy: { order: "asc" } },
      logicRules: true,
      profiles: { orderBy: { order: "asc" } },
    },
  });
  if (!source) {
    return { error: "Funnel no encontrado." as const };
  }

  const name = `${source.name} (copia)`;
  const slug = await generateUniqueSlug(name);

  const newFunnelId = randomUUID();
  const questionIdMap = new Map<string, string>();
  const optionIdMap = new Map<string, string>();
  const profileIdMap = new Map<string, string>();

  for (const q of source.questions) {
    questionIdMap.set(q.id, randomUUID());
    for (const o of q.options) {
      optionIdMap.set(o.id, randomUUID());
    }
  }
  for (const p of source.profiles) {
    profileIdMap.set(p.id, randomUUID());
  }

  const copy = await prisma.$transaction(async (tx) => {
    const created = await tx.funnel.create({
      data: {
        id: newFunnelId,
        workspaceId: ctx.workspaceId,
        createdBy: ctx.userId,
        name,
        slug,
        status: "DRAFT",
        goal: source.goal,
        industry: source.industry,
        audience: source.audience,
        intro: source.intro ?? undefined,
        theme: source.theme ?? undefined,
        leadCapture: source.leadCapture ?? undefined,
        cta: source.cta ?? undefined,
      },
    });

    if (source.questions.length > 0) {
      await tx.question.createMany({
        data: source.questions.map((q) => ({
          id: questionIdMap.get(q.id)!,
          funnelId: newFunnelId,
          type: q.type,
          title: q.title,
          description: q.description,
          required: q.required,
          order: q.order,
          settings: q.settings ?? undefined,
        })),
      });
      const allOptions = source.questions.flatMap((q) =>
        q.options.map((o) => ({
          id: optionIdMap.get(o.id)!,
          questionId: questionIdMap.get(q.id)!,
          label: o.label,
          value: o.value,
          order: o.order,
          imageUrl: o.imageUrl,
        }))
      );
      if (allOptions.length > 0) {
        await tx.questionOption.createMany({ data: allOptions });
      }
    }

    if (source.profiles.length > 0) {
      await tx.resultProfile.createMany({
        data: source.profiles.map((p) => ({
          id: profileIdMap.get(p.id)!,
          funnelId: newFunnelId,
          key: p.key,
          title: p.title,
          description: p.description,
          recommendation: p.recommendation,
          imageUrl: p.imageUrl,
          ctaOverride: p.ctaOverride ?? undefined,
          order: p.order,
        })),
      });
    }

    if (source.logicRules.length > 0) {
      await tx.logicRule.createMany({
        data: source.logicRules.map((r) => ({
          funnelId: newFunnelId,
          questionId: questionIdMap.get(r.questionId)!,
          optionId: r.optionId ? (optionIdMap.get(r.optionId) ?? null) : null,
          action: r.action,
          targetProfileId: r.targetProfileId
            ? (profileIdMap.get(r.targetProfileId) ?? null)
            : null,
          points: r.points,
          targetQuestionId: r.targetQuestionId
            ? (questionIdMap.get(r.targetQuestionId) ?? null)
            : null,
        })),
      });
    }

    return created;
  });

  return { funnel: copy };
}

/**
 * Borrado definitivo: elimina el funnel y, en cascada, preguntas, sesiones,
 * respuestas, leads y eventos asociados. Devuelve los contadores para que la
 * UI pueda advertir antes de confirmar.
 */
export async function deleteFunnel(ctx: Ctx, funnelId: string) {
  const funnel = await prisma.funnel.findFirst({
    where: { id: funnelId, workspaceId: ctx.workspaceId },
    select: { id: true },
  });
  if (!funnel) {
    return { error: "Funnel no encontrado." as const };
  }
  await prisma.funnel.delete({ where: { id: funnelId } });
  return { success: true as const };
}

export async function getFunnelImpact(ctx: Ctx, funnelId: string) {
  return prisma.funnel.findFirst({
    where: { id: funnelId, workspaceId: ctx.workspaceId },
    select: {
      id: true,
      name: true,
      _count: { select: { leads: true, sessions: true } },
    },
  });
}
