import "server-only";

import { prisma } from "@/lib/db";

export interface KpiValue {
  value: number;
  /** Variación porcentual frente al periodo anterior; null si no hay base. */
  delta: number | null;
}

export interface DashboardMetrics {
  activeFunnels: KpiValue;
  views: KpiValue;
  leads: KpiValue;
  conversionRate: KpiValue;
  totalFunnels: number;
  starts: number;
  completions: number;
  conversions: number;
}

export interface SeriesPoint {
  date: string;
  views: number;
  leads: number;
  conversions: number;
}

function percentDelta(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/**
 * KPIs del dashboard comparando el periodo indicado con el inmediatamente
 * anterior de la misma duración.
 */
export async function getDashboardMetrics(
  ctx: { workspaceId: string },
  days = 30
): Promise<DashboardMetrics> {
  const now = new Date();
  const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const previousStart = new Date(
    now.getTime() - 2 * days * 24 * 60 * 60 * 1000
  );
  const where = { workspaceId: ctx.workspaceId };

  const [funnelCounts, currentEvents, previousEvents, leadsNow, leadsPrev, conversions] =
    await Promise.all([
      prisma.funnel.groupBy({
        by: ["status"],
        where,
        _count: { _all: true },
      }),
      prisma.analyticsEvent.groupBy({
        by: ["type"],
        where: { ...where, createdAt: { gte: periodStart } },
        _count: { _all: true },
      }),
      prisma.analyticsEvent.groupBy({
        by: ["type"],
        where: { ...where, createdAt: { gte: previousStart, lt: periodStart } },
        _count: { _all: true },
      }),
      prisma.lead.count({ where: { ...where, createdAt: { gte: periodStart } } }),
      prisma.lead.count({
        where: { ...where, createdAt: { gte: previousStart, lt: periodStart } },
      }),
      prisma.lead.count({ where: { ...where, status: "CONVERTED" } }),
    ]);

  const funnelsByStatus = Object.fromEntries(
    funnelCounts.map((row) => [row.status, row._count._all])
  );
  const current = Object.fromEntries(
    currentEvents.map((row) => [row.type, row._count._all])
  );
  const previous = Object.fromEntries(
    previousEvents.map((row) => [row.type, row._count._all])
  );

  const viewsNow = current.FUNNEL_VIEW ?? 0;
  const viewsPrev = previous.FUNNEL_VIEW ?? 0;
  const rateNow = viewsNow > 0 ? (leadsNow / viewsNow) * 100 : 0;
  const ratePrev = viewsPrev > 0 ? (leadsPrev / viewsPrev) * 100 : 0;

  const activeFunnels = funnelsByStatus.PUBLISHED ?? 0;

  return {
    activeFunnels: { value: activeFunnels, delta: null },
    views: { value: viewsNow, delta: percentDelta(viewsNow, viewsPrev) },
    leads: { value: leadsNow, delta: percentDelta(leadsNow, leadsPrev) },
    conversionRate: {
      value: Math.round(rateNow * 10) / 10,
      delta:
        ratePrev === 0 ? null : Math.round((rateNow - ratePrev) * 10) / 10,
    },
    totalFunnels:
      (funnelsByStatus.DRAFT ?? 0) +
      activeFunnels +
      (funnelsByStatus.ARCHIVED ?? 0),
    starts: current.FUNNEL_START ?? 0,
    completions: current.FUNNEL_COMPLETED ?? 0,
    conversions,
  };
}

/** Serie diaria de visitas, leads y conversiones para el gráfico. */
export async function getDashboardSeries(
  ctx: { workspaceId: string },
  days = 30
): Promise<SeriesPoint[]> {
  const now = new Date();
  const start = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  start.setHours(0, 0, 0, 0);

  const [events, leads] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: {
        workspaceId: ctx.workspaceId,
        createdAt: { gte: start },
        type: { in: ["FUNNEL_VIEW", "CTA_CLICKED"] },
      },
      select: { type: true, createdAt: true },
    }),
    prisma.lead.findMany({
      where: { workspaceId: ctx.workspaceId, createdAt: { gte: start } },
      select: { createdAt: true },
    }),
  ]);

  const buckets = new Map<string, SeriesPoint>();
  for (let i = 0; i < days; i++) {
    const day = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const key = day.toISOString().slice(0, 10);
    buckets.set(key, { date: key, views: 0, leads: 0, conversions: 0 });
  }

  for (const event of events) {
    const key = event.createdAt.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    if (event.type === "FUNNEL_VIEW") bucket.views += 1;
    else bucket.conversions += 1;
  }
  for (const lead of leads) {
    const bucket = buckets.get(lead.createdAt.toISOString().slice(0, 10));
    if (bucket) bucket.leads += 1;
  }

  return [...buckets.values()];
}

export async function getRecentFunnels(ctx: { workspaceId: string }) {
  const funnels = await prisma.funnel.findMany({
    where: { workspaceId: ctx.workspaceId, status: { not: "ARCHIVED" } },
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      industry: true,
      updatedAt: true,
      _count: { select: { leads: true, sessions: true } },
    },
  });

  // Visitas por funnel para la columna "Visitas" de la tabla.
  const views = await prisma.analyticsEvent.groupBy({
    by: ["funnelId"],
    where: {
      workspaceId: ctx.workspaceId,
      type: "FUNNEL_VIEW",
      funnelId: { in: funnels.map((f) => f.id) },
    },
    _count: { _all: true },
  });
  const viewsByFunnel = new Map(views.map((v) => [v.funnelId, v._count._all]));

  return funnels.map((funnel) => {
    const funnelViews = viewsByFunnel.get(funnel.id) ?? 0;
    return {
      ...funnel,
      views: funnelViews,
      conversionRate:
        funnelViews > 0
          ? Math.round((funnel._count.leads / funnelViews) * 1000) / 10
          : 0,
    };
  });
}
