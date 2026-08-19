import "server-only";

import { prisma } from "@/lib/db";
import { PLAN_LIMITS } from "@/lib/plans";
import type { Plan } from "@/generated/prisma/enums";

function startOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

async function countResponsesThisMonth(workspaceId: string): Promise<number> {
  return prisma.responseSession.count({
    where: {
      funnel: { workspaceId },
      startedAt: { gte: startOfMonth() },
    },
  });
}

export async function getWorkspacePlanUsage(workspaceId: string) {
  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    select: { plan: true, planActivatedAt: true, planNote: true },
  });
  const limits = PLAN_LIMITS[workspace.plan];

  const [publishedFunnels, responsesThisMonth] = await Promise.all([
    prisma.funnel.count({ where: { workspaceId, status: "PUBLISHED" } }),
    countResponsesThisMonth(workspaceId),
  ]);

  return {
    plan: workspace.plan,
    planActivatedAt: workspace.planActivatedAt,
    planNote: workspace.planNote,
    limits,
    publishedFunnels,
    responsesThisMonth,
  };
}

/** true si el workspace puede publicar un funnel más (excluyendo el que ya podría estar publicado). */
export async function canPublishAnotherFunnel(
  workspaceId: string,
  excludeFunnelId: string
): Promise<boolean> {
  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    select: { plan: true },
  });
  const limits = PLAN_LIMITS[workspace.plan];
  const count = await prisma.funnel.count({
    where: { workspaceId, status: "PUBLISHED", id: { not: excludeFunnelId } },
  });
  return count < limits.maxPublishedFunnels;
}

/** true si el workspace ya alcanzó su cuota de respuestas del mes en curso. */
export async function hasReachedResponseQuota(
  workspaceId: string
): Promise<boolean> {
  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    select: { plan: true },
  });
  const limits = PLAN_LIMITS[workspace.plan];
  const count = await countResponsesThisMonth(workspaceId);
  return count >= limits.maxResponsesPerMonth;
}

export async function updateWorkspacePlan(
  workspaceId: string,
  plan: Plan,
  note?: string
) {
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      plan,
      planActivatedAt: new Date(),
      planNote: note?.trim() || null,
    },
  });
}
