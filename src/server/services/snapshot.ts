import "server-only";

import { prisma } from "@/lib/db";
import {
  parseCta,
  parseIntro,
  parseLeadCapture,
  parseTheme,
  questionSettingsSchema,
  type FunnelSnapshot,
} from "@/lib/funnel-config";

interface Ctx {
  workspaceId: string;
}

/**
 * Compila el borrador actual de un funnel al formato de snapshot que
 * consumen el preview, el runner y (al publicar) FunnelVersion.snapshot.
 */
export async function compileFunnelSnapshot(
  ctx: Ctx,
  funnelId: string
): Promise<FunnelSnapshot | null> {
  const funnel = await prisma.funnel.findFirst({
    where: { id: funnelId, workspaceId: ctx.workspaceId },
    include: {
      questions: {
        include: { options: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      },
      profiles: { orderBy: { order: "asc" } },
      logicRules: true,
      workspace: { select: { name: true, brand: { select: { businessName: true } } } },
    },
  });
  if (!funnel) return null;

  return {
    funnelId: funnel.id,
    name: funnel.name,
    slug: funnel.slug,
    businessName:
      funnel.workspace.brand?.businessName?.trim() || undefined,
    industry: funnel.industry?.trim() || undefined,
    intro: parseIntro(funnel.intro),
    theme: parseTheme(funnel.theme),
    leadCapture: parseLeadCapture(funnel.leadCapture),
    cta: parseCta(funnel.cta),
    questions: funnel.questions.map((q) => ({
      id: q.id,
      type: q.type,
      title: q.title,
      description: q.description,
      required: q.required,
      order: q.order,
      settings: q.settings
        ? (questionSettingsSchema.safeParse(q.settings).data ?? null)
        : null,
      options: q.options.map((o) => ({
        id: o.id,
        label: o.label,
        value: o.value,
        order: o.order,
        imageUrl: o.imageUrl,
      })),
    })),
    profiles: funnel.profiles.map((p) => ({
      id: p.id,
      key: p.key,
      title: p.title,
      description: p.description,
      recommendation: p.recommendation,
      imageUrl: p.imageUrl,
      ctaOverride: p.ctaOverride ? parseCta(p.ctaOverride) : null,
      order: p.order,
    })),
    rules: funnel.logicRules.map((r) => ({
      id: r.id,
      questionId: r.questionId,
      optionId: r.optionId,
      action: r.action,
      targetProfileId: r.targetProfileId,
      points: r.points,
      targetQuestionId: r.targetQuestionId,
    })),
  };
}
