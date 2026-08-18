import "server-only";

import { randomUUID } from "crypto";

import { prisma } from "@/lib/db";
import {
  DEFAULT_CTA,
  DEFAULT_INTRO,
  DEFAULT_LEAD_CAPTURE,
  DEFAULT_THEME,
  themeSchema,
  type ThemeConfig,
} from "@/lib/funnel-config";
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

/** Aplica logo/color/tipografía de la marca del workspace sobre el tema por defecto. */
async function resolveTheme(ctx: Ctx, applyBrand?: boolean): Promise<ThemeConfig> {
  if (!applyBrand) return DEFAULT_THEME;

  const brand = await prisma.brandSettings.findUnique({
    where: { workspaceId: ctx.workspaceId },
  });
  if (!brand) return DEFAULT_THEME;

  const candidate = {
    ...DEFAULT_THEME,
    ...(brand.logoUrl ? { logoUrl: brand.logoUrl } : {}),
    ...(brand.primaryColor ? { primaryColor: brand.primaryColor } : {}),
    ...(brand.font ? { font: brand.font } : {}),
  };
  const parsed = themeSchema.safeParse(candidate);
  return parsed.success ? parsed.data : DEFAULT_THEME;
}

export async function createFunnel(
  ctx: Ctx,
  data: {
    name: string;
    goal?: string;
    industry?: string;
    audience?: string;
    applyBrand?: boolean;
  }
) {
  const [slug, theme] = await Promise.all([
    generateUniqueSlug(data.name),
    resolveTheme(ctx, data.applyBrand),
  ]);
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
      theme,
      leadCapture: DEFAULT_LEAD_CAPTURE,
      cta: DEFAULT_CTA,
    },
  });
}

/** Aplica la marca del workspace al tema de un funnel ya existente. */
export async function applyBrandToFunnel(ctx: Ctx, funnelId: string) {
  const funnel = await prisma.funnel.findFirst({
    where: { id: funnelId, workspaceId: ctx.workspaceId },
    select: { id: true },
  });
  if (!funnel) return { error: "Funnel no encontrado." as const };

  const brand = await prisma.brandSettings.findUnique({
    where: { workspaceId: ctx.workspaceId },
  });
  if (!brand || (!brand.logoUrl && !brand.primaryColor && !brand.font)) {
    return {
      error:
        "Configura tu marca en «Mi Marca» antes de aplicarla a un funnel." as const,
    };
  }

  const current = await prisma.funnel.findUniqueOrThrow({
    where: { id: funnelId },
    select: { theme: true },
  });
  const candidate = {
    ...DEFAULT_THEME,
    ...(typeof current.theme === "object" && current.theme ? current.theme : {}),
    ...(brand.logoUrl ? { logoUrl: brand.logoUrl } : {}),
    ...(brand.primaryColor ? { primaryColor: brand.primaryColor } : {}),
    ...(brand.font ? { font: brand.font } : {}),
  };
  const parsed = themeSchema.safeParse(candidate);
  if (!parsed.success) {
    return { error: "No se pudo aplicar la marca." as const };
  }

  await prisma.funnel.update({
    where: { id: funnelId },
    data: { theme: parsed.data },
  });
  return { success: true as const };
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
