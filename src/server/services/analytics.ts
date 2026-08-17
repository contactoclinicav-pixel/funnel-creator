import "server-only";

import { prisma } from "@/lib/db";
import { funnelSnapshotSchema } from "@/lib/funnel-config";
import { compileFunnelSnapshot } from "@/server/services/snapshot";

interface Ctx {
  userId: string;
  workspaceId: string;
}

export interface FunnelOverview {
  id: string;
  name: string;
  slug: string;
  status: string;
  views: number;
  starts: number;
  completions: number;
  leads: number;
  conversionRate: number;
}

/** Resumen por funnel para la página de Analytics. */
export async function getFunnelOverviews(ctx: Ctx): Promise<FunnelOverview[]> {
  const funnels = await prisma.funnel.findMany({
    where: { workspaceId: ctx.workspaceId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, slug: true, status: true },
  });

  const events = await prisma.analyticsEvent.groupBy({
    by: ["funnelId", "type"],
    where: { workspaceId: ctx.workspaceId },
    _count: { _all: true },
  });
  const byFunnel = new Map<string, Record<string, number>>();
  for (const row of events) {
    const entry = byFunnel.get(row.funnelId) ?? {};
    entry[row.type] = row._count._all;
    byFunnel.set(row.funnelId, entry);
  }

  return funnels.map((funnel) => {
    const counts = byFunnel.get(funnel.id) ?? {};
    const views = counts.FUNNEL_VIEW ?? 0;
    const leads = counts.LEAD_CREATED ?? 0;
    return {
      ...funnel,
      views,
      starts: counts.FUNNEL_START ?? 0,
      completions: counts.FUNNEL_COMPLETED ?? 0,
      leads,
      conversionRate: views > 0 ? Math.round((leads / views) * 1000) / 10 : 0,
    };
  });
}

export interface QuestionDropoff {
  questionId: string;
  title: string;
  order: number;
  answeredSessions: number;
  /** % de sesiones iniciadas que respondieron esta pregunta. */
  reachRate: number;
}

export interface FunnelAnalytics {
  funnel: { id: string; name: string; slug: string; status: string };
  steps: {
    views: number;
    starts: number;
    completions: number;
    leads: number;
    ctaClicks: number;
  };
  rates: {
    /** leads / visitas */
    conversionRate: number;
    /** completados / inicios */
    completionRate: number;
    /** leads / completados */
    leadCaptureRate: number;
    /** clics CTA / resultados vistos */
    ctaClickRate: number;
  };
  resultsViewed: number;
  dropoff: QuestionDropoff[];
  /** Sesiones consideradas para el abandono (las conservadas en DB). */
  dropoffSessions: number;
}

function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

export async function getFunnelAnalytics(
  ctx: Ctx,
  funnelId: string
): Promise<FunnelAnalytics | null> {
  const funnel = await prisma.funnel.findFirst({
    where: { id: funnelId, workspaceId: ctx.workspaceId },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 1,
        select: { snapshot: true },
      },
    },
  });
  if (!funnel) return null;

  const [events, answerCounts, sessionCount] = await Promise.all([
    prisma.analyticsEvent.groupBy({
      by: ["type"],
      where: { funnelId },
      _count: { _all: true },
    }),
    prisma.answer.groupBy({
      by: ["questionId"],
      where: { session: { funnelId } },
      _count: { _all: true },
    }),
    prisma.responseSession.count({ where: { funnelId } }),
  ]);

  const counts = Object.fromEntries(
    events.map((row) => [row.type, row._count._all])
  );
  const views = counts.FUNNEL_VIEW ?? 0;
  const starts = counts.FUNNEL_START ?? 0;
  const completions = counts.FUNNEL_COMPLETED ?? 0;
  const leads = counts.LEAD_CREATED ?? 0;
  const ctaClicks = counts.CTA_CLICKED ?? 0;
  const resultsViewed = counts.RESULT_VIEWED ?? 0;

  // Preguntas: usa el último snapshot publicado; si no hay, el draft.
  let questions: { id: string; title: string; order: number }[] = [];
  const versionSnapshot = funnel.versions[0]?.snapshot;
  if (versionSnapshot) {
    const parsed = funnelSnapshotSchema.safeParse(versionSnapshot);
    if (parsed.success) {
      questions = parsed.data.questions.map((q) => ({
        id: q.id,
        title: q.title,
        order: q.order,
      }));
    }
  }
  if (questions.length === 0) {
    const draft = await compileFunnelSnapshot(ctx, funnelId);
    questions =
      draft?.questions.map((q) => ({
        id: q.id,
        title: q.title,
        order: q.order,
      })) ?? [];
  }

  const answeredByQuestion = new Map(
    answerCounts.map((row) => [row.questionId, row._count._all])
  );
  const dropoff: QuestionDropoff[] = questions
    .sort((a, b) => a.order - b.order)
    .map((q) => {
      const answered = answeredByQuestion.get(q.id) ?? 0;
      return {
        questionId: q.id,
        title: q.title,
        order: q.order,
        answeredSessions: answered,
        reachRate: pct(answered, sessionCount),
      };
    });

  return {
    funnel: {
      id: funnel.id,
      name: funnel.name,
      slug: funnel.slug,
      status: funnel.status,
    },
    steps: { views, starts, completions, leads, ctaClicks },
    rates: {
      conversionRate: pct(leads, views),
      completionRate: pct(completions, starts),
      leadCaptureRate: pct(leads, completions),
      ctaClickRate: pct(ctaClicks, resultsViewed),
    },
    resultsViewed,
    dropoff,
    dropoffSessions: sessionCount,
  };
}
