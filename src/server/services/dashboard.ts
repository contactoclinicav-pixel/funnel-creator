import "server-only";

import { prisma } from "@/lib/db";

export interface DashboardMetrics {
  activeFunnels: number;
  totalFunnels: number;
  views: number;
  starts: number;
  completions: number;
  leads: number;
  conversions: number;
  /** leads / visitas, en porcentaje (0 si no hay visitas). */
  conversionRate: number;
}

export async function getDashboardMetrics(ctx: {
  workspaceId: string;
}): Promise<DashboardMetrics> {
  const where = { workspaceId: ctx.workspaceId };

  const [funnelCounts, eventCounts, leads, conversions] = await Promise.all([
    prisma.funnel.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["type"],
      where,
      _count: { _all: true },
    }),
    prisma.lead.count({ where }),
    prisma.lead.count({ where: { ...where, status: "CONVERTED" } }),
  ]);

  const funnelsByStatus = Object.fromEntries(
    funnelCounts.map((row) => [row.status, row._count._all])
  );
  const eventsByType = Object.fromEntries(
    eventCounts.map((row) => [row.type, row._count._all])
  );

  const views = eventsByType.FUNNEL_VIEW ?? 0;

  return {
    activeFunnels: funnelsByStatus.PUBLISHED ?? 0,
    totalFunnels:
      (funnelsByStatus.DRAFT ?? 0) +
      (funnelsByStatus.PUBLISHED ?? 0) +
      (funnelsByStatus.ARCHIVED ?? 0),
    views,
    starts: eventsByType.FUNNEL_START ?? 0,
    completions: eventsByType.FUNNEL_COMPLETED ?? 0,
    leads,
    conversions,
    conversionRate: views > 0 ? Math.round((leads / views) * 1000) / 10 : 0,
  };
}

export async function getRecentFunnels(ctx: { workspaceId: string }) {
  return prisma.funnel.findMany({
    where: { workspaceId: ctx.workspaceId, status: { not: "ARCHIVED" } },
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      updatedAt: true,
      _count: { select: { leads: true, sessions: true } },
    },
  });
}
