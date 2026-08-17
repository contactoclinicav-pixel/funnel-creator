import "server-only";

import { prisma } from "@/lib/db";
import {
  funnelSnapshotSchema,
  type FunnelSnapshot,
} from "@/lib/funnel-config";
import { computeResult, type AnswerMap, type AnswerValue } from "@/lib/result-engine";
import type { Prisma } from "@/generated/prisma/client";
import type { EventType } from "@/generated/prisma/enums";

/**
 * Acceso público al funnel publicado. Aquí NO hay sesión de usuario:
 * el workspace se resuelve siempre desde el funnel publicado, jamás desde
 * datos del visitante.
 */

export interface PublishedFunnel {
  funnelId: string;
  workspaceId: string;
  versionId: string;
  versionNumber: number;
  snapshot: FunnelSnapshot;
}

export async function getPublishedFunnelBySlug(
  slug: string
): Promise<PublishedFunnel | null> {
  const funnel = await prisma.funnel.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      id: true,
      workspaceId: true,
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 1,
        select: { id: true, versionNumber: true, snapshot: true },
      },
    },
  });
  const version = funnel?.versions[0];
  if (!funnel || !version) return null;

  const snapshot = funnelSnapshotSchema.safeParse(version.snapshot);
  if (!snapshot.success) return null;

  return {
    funnelId: funnel.id,
    workspaceId: funnel.workspaceId,
    versionId: version.id,
    versionNumber: version.versionNumber,
    snapshot: snapshot.data,
  };
}

export async function logEvent(data: {
  workspaceId: string;
  funnelId: string;
  sessionId?: string | null;
  type: EventType;
  questionId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await prisma.analyticsEvent.create({
    data: {
      workspaceId: data.workspaceId,
      funnelId: data.funnelId,
      sessionId: data.sessionId ?? null,
      type: data.type,
      questionId: data.questionId ?? null,
      metadata: data.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

/** Carga una sesión con su funnel y snapshot de versión, o null. */
async function getSessionContext(sessionId: string) {
  const session = await prisma.responseSession.findUnique({
    where: { id: sessionId },
    include: {
      funnel: { select: { id: true, workspaceId: true, status: true } },
      version: { select: { id: true, snapshot: true } },
    },
  });
  if (!session) return null;
  const snapshot = funnelSnapshotSchema.safeParse(session.version.snapshot);
  if (!snapshot.success) return null;
  return { session, snapshot: snapshot.data };
}

// ── Operaciones del visitante ─────────────────────────────

export async function startSession(input: {
  slug: string;
  visitorId: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referrer?: string | null;
}) {
  const published = await getPublishedFunnelBySlug(input.slug);
  if (!published) return { error: "Funnel no disponible." as const };

  const session = await prisma.responseSession.create({
    data: {
      funnelId: published.funnelId,
      funnelVersionId: published.versionId,
      visitorId: input.visitorId,
      utmSource: input.utmSource,
      utmMedium: input.utmMedium,
      utmCampaign: input.utmCampaign,
      referrer: input.referrer,
    },
  });
  await logEvent({
    workspaceId: published.workspaceId,
    funnelId: published.funnelId,
    sessionId: session.id,
    type: "FUNNEL_START",
  });
  return { sessionId: session.id };
}

export async function saveAnswer(input: {
  sessionId: string;
  questionId: string;
  value: AnswerValue;
}) {
  const ctx = await getSessionContext(input.sessionId);
  if (!ctx) return { error: "Sesión no válida." as const };
  if (ctx.session.completedAt) {
    return { error: "La sesión ya está completada." as const };
  }
  const question = ctx.snapshot.questions.find(
    (q) => q.id === input.questionId
  );
  if (!question) return { error: "Pregunta no válida." as const };

  // Para tipos de opciones, valida que los ids existan en el snapshot.
  if (Array.isArray(input.value)) {
    const validIds = new Set(question.options.map((o) => o.id));
    if (!input.value.every((id) => validIds.has(id))) {
      return { error: "Opción no válida." as const };
    }
  }

  const existing = await prisma.answer.findFirst({
    where: { sessionId: input.sessionId, questionId: input.questionId },
    select: { id: true },
  });
  if (existing) {
    await prisma.answer.update({
      where: { id: existing.id },
      data: { value: input.value },
    });
  } else {
    await prisma.answer.create({
      data: {
        sessionId: input.sessionId,
        questionId: input.questionId,
        value: input.value,
      },
    });
  }

  await logEvent({
    workspaceId: ctx.session.funnel.workspaceId,
    funnelId: ctx.session.funnel.id,
    sessionId: input.sessionId,
    type: "QUESTION_ANSWERED",
    questionId: input.questionId,
  });
  return { success: true as const };
}

/**
 * Completa la sesión: recalcula el resultado en el servidor a partir de las
 * respuestas persistidas (fuente autoritativa) y lo guarda.
 */
export async function completeSession(input: { sessionId: string }) {
  const ctx = await getSessionContext(input.sessionId);
  if (!ctx) return { error: "Sesión no válida." as const };
  if (ctx.session.completedAt) {
    // Idempotente: devuelve el resultado ya calculado.
    const profile =
      ctx.snapshot.profiles.find(
        (p) => p.id === ctx.session.resultProfileId
      ) ?? null;
    return { profileId: profile?.id ?? null };
  }

  const answers = await prisma.answer.findMany({
    where: { sessionId: input.sessionId },
    select: { questionId: true, value: true },
  });
  const answerMap: AnswerMap = {};
  for (const a of answers) {
    answerMap[a.questionId] = a.value as AnswerValue;
  }

  const outcome = computeResult(ctx.snapshot, answerMap);
  await prisma.responseSession.update({
    where: { id: input.sessionId },
    data: {
      completedAt: new Date(),
      scores: outcome.scores,
      resultProfileId: outcome.profile?.id ?? null,
    },
  });
  await logEvent({
    workspaceId: ctx.session.funnel.workspaceId,
    funnelId: ctx.session.funnel.id,
    sessionId: input.sessionId,
    type: "FUNNEL_COMPLETED",
  });
  return { profileId: outcome.profile?.id ?? null };
}

export async function createLeadFromSession(input: {
  sessionId: string;
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  consent: boolean;
}) {
  const ctx = await getSessionContext(input.sessionId);
  if (!ctx) return { error: "Sesión no válida." as const };

  const config = ctx.snapshot.leadCapture;
  // Validación server-side contra la configuración publicada.
  for (const field of config.fields) {
    if (!field.enabled) continue;
    const value = input[field.key];
    if (field.required && (!value || value.trim().length === 0)) {
      return { error: `El campo ${field.label} es obligatorio.` };
    }
  }
  if (config.consent.enabled && !input.consent) {
    return { error: "Debes aceptar el consentimiento." as const };
  }

  const enabled = new Set(
    config.fields.filter((f) => f.enabled).map((f) => f.key)
  );

  const existing = await prisma.lead.findUnique({
    where: { sessionId: input.sessionId },
    select: { id: true },
  });
  if (existing) {
    return { leadId: existing.id }; // idempotente
  }

  const lead = await prisma.lead.create({
    data: {
      workspaceId: ctx.session.funnel.workspaceId,
      funnelId: ctx.session.funnel.id,
      sessionId: input.sessionId,
      // Minimización de datos: solo se guardan los campos habilitados.
      name: enabled.has("name") ? input.name?.trim() || null : null,
      email: enabled.has("email") ? input.email?.trim() || null : null,
      phone: enabled.has("phone") ? input.phone?.trim() || null : null,
      city: enabled.has("city") ? input.city?.trim() || null : null,
      consent: input.consent,
      resultProfileId: ctx.session.resultProfileId,
    },
  });
  await logEvent({
    workspaceId: ctx.session.funnel.workspaceId,
    funnelId: ctx.session.funnel.id,
    sessionId: input.sessionId,
    type: "LEAD_CREATED",
  });
  return { leadId: lead.id };
}

export async function trackSessionEvent(input: {
  sessionId: string;
  type: "RESULT_VIEWED" | "CTA_CLICKED";
  metadata?: Record<string, unknown>;
}) {
  const ctx = await getSessionContext(input.sessionId);
  if (!ctx) return { error: "Sesión no válida." as const };

  await logEvent({
    workspaceId: ctx.session.funnel.workspaceId,
    funnelId: ctx.session.funnel.id,
    sessionId: input.sessionId,
    type: input.type,
    metadata: input.metadata,
  });

  if (input.type === "CTA_CLICKED") {
    const ctaType =
      typeof input.metadata?.ctaType === "string"
        ? input.metadata.ctaType
        : "cta";
    await prisma.lead.updateMany({
      where: { sessionId: input.sessionId },
      data: { ctaClicked: ctaType },
    });
  }
  return { success: true as const };
}
