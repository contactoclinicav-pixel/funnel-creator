import "server-only";

import { prisma } from "@/lib/db";
import {
  funnelSnapshotSchema,
  type FunnelSnapshot,
  type SnapshotQuestion,
} from "@/lib/funnel-config";
import type { AnswerValue } from "@/lib/result-engine";
import type { LeadStatus } from "@/generated/prisma/enums";

interface Ctx {
  userId: string;
  workspaceId: string;
}

export const LEAD_STATUSES: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "CONVERTED",
  "LOST",
];

export async function listLeads(
  ctx: Ctx,
  filter?: { status?: LeadStatus; funnelId?: string }
) {
  const leads = await prisma.lead.findMany({
    where: {
      workspaceId: ctx.workspaceId,
      ...(filter?.status ? { status: filter.status } : {}),
      ...(filter?.funnelId ? { funnelId: filter.funnelId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      city: true,
      status: true,
      createdAt: true,
      resultProfileId: true,
      funnel: { select: { id: true, name: true } },
    },
  });

  // Resuelve títulos de perfiles referenciados (pueden haber sido borrados).
  const profileIds = [
    ...new Set(leads.map((l) => l.resultProfileId).filter(Boolean)),
  ] as string[];
  const profiles = profileIds.length
    ? await prisma.resultProfile.findMany({
        where: { id: { in: profileIds }, funnel: { workspaceId: ctx.workspaceId } },
        select: { id: true, title: true },
      })
    : [];
  const profileTitle = new Map(profiles.map((p) => [p.id, p.title]));

  return leads.map((lead) => ({
    ...lead,
    resultTitle: lead.resultProfileId
      ? (profileTitle.get(lead.resultProfileId) ?? null)
      : null,
  }));
}

export interface LeadAnswerView {
  questionTitle: string;
  display: string;
}

export async function getLeadDetail(ctx: Ctx, leadId: string) {
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, workspaceId: ctx.workspaceId },
    include: {
      funnel: { select: { id: true, name: true, slug: true } },
      notes: { orderBy: { createdAt: "desc" } },
      session: {
        include: {
          answers: { orderBy: { createdAt: "asc" } },
          version: { select: { snapshot: true, versionNumber: true } },
        },
      },
    },
  });
  if (!lead) return null;

  // Nombres de autores de notas.
  const authorIds = [...new Set(lead.notes.map((n) => n.authorId))];
  const authors = authorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: authorIds } },
        select: { id: true, name: true },
      })
    : [];
  const authorName = new Map(authors.map((a) => [a.id, a.name]));

  let snapshot: FunnelSnapshot | null = null;
  if (lead.session?.version.snapshot) {
    const parsed = funnelSnapshotSchema.safeParse(lead.session.version.snapshot);
    snapshot = parsed.success ? parsed.data : null;
  }

  const answers: LeadAnswerView[] = [];
  if (lead.session && snapshot) {
    const questionById = new Map(snapshot.questions.map((q) => [q.id, q]));
    for (const answer of lead.session.answers) {
      const question = questionById.get(answer.questionId);
      if (!question) continue;
      answers.push({
        questionTitle: question.title,
        display: formatAnswer(question, answer.value as AnswerValue),
      });
    }
  }

  const resultTitle =
    lead.resultProfileId && snapshot
      ? (snapshot.profiles.find((p) => p.id === lead.resultProfileId)?.title ??
        null)
      : null;

  return {
    lead,
    answers,
    resultTitle,
    notes: lead.notes.map((n) => ({
      id: n.id,
      body: n.body,
      createdAt: n.createdAt,
      authorName: authorName.get(n.authorId) ?? "Usuario",
    })),
  };
}

function formatAnswer(
  question: SnapshotQuestion,
  value: AnswerValue
): string {
  if (Array.isArray(value)) {
    const labelById = new Map(question.options.map((o) => [o.id, o.label]));
    const labels = value.map((id) => labelById.get(id) ?? "—");
    return labels.join(", ") || "—";
  }
  if (typeof value === "number") return String(value);
  return value?.trim() || "—";
}

export async function updateLeadStatus(
  ctx: Ctx,
  leadId: string,
  status: LeadStatus
) {
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, workspaceId: ctx.workspaceId },
    select: { id: true },
  });
  if (!lead) return { error: "Lead no encontrado." as const };
  await prisma.lead.update({ where: { id: leadId }, data: { status } });
  return { success: true as const };
}

export async function addLeadNote(ctx: Ctx, leadId: string, body: string) {
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, workspaceId: ctx.workspaceId },
    select: { id: true },
  });
  if (!lead) return { error: "Lead no encontrado." as const };
  await prisma.leadNote.create({
    data: { leadId, authorId: ctx.userId, body },
  });
  return { success: true as const };
}

/**
 * Elimina el lead y todos sus datos personales: la sesión de respuesta
 * asociada (con sus respuestas) cae en cascada.
 */
export async function deleteLeadWithData(ctx: Ctx, leadId: string) {
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, workspaceId: ctx.workspaceId },
    select: { id: true, sessionId: true },
  });
  if (!lead) return { error: "Lead no encontrado." as const };

  await prisma.$transaction(async (tx) => {
    await tx.lead.delete({ where: { id: leadId } });
    if (lead.sessionId) {
      await tx.responseSession.delete({ where: { id: lead.sessionId } });
    }
  });
  return { success: true as const };
}
