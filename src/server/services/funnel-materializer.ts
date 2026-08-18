import "server-only";

import { randomUUID } from "crypto";

import { prisma } from "@/lib/db";
import {
  DEFAULT_LEAD_CAPTURE,
  DEFAULT_THEME,
  type CtaConfig,
  type LeadCaptureConfig,
  type ThemeConfig,
} from "@/lib/funnel-config";
import type { FunnelGeneration } from "@/server/ai/generation-schema";
import { generateUniqueSlug } from "@/server/services/funnel";

interface Ctx {
  userId: string;
  workspaceId: string;
}

/**
 * Construye el funnel completo (preguntas, opciones, perfiles, reglas) a
 * partir de un spec con referencias por índice/key — el shape compartido
 * por la generación con IA y las plantillas. Todo en una transacción: si
 * algo falla, no se persiste nada.
 */
export async function materializeFunnelFromSpec(
  ctx: Ctx,
  spec: FunnelGeneration,
  fallbacks?: { goal?: string; industry?: string; audience?: string }
): Promise<string> {
  const slug = await generateUniqueSlug(spec.name);
  const funnelId = randomUUID();

  // Pre-genera ids para poder mapear las referencias por índice/key del spec.
  const questionIds = spec.questions.map(() => randomUUID());
  const optionIds = spec.questions.map((q) => q.options.map(() => randomUUID()));
  const profileIdByKey = new Map(spec.profiles.map((p) => [p.key, randomUUID()]));

  const theme: ThemeConfig = {
    ...DEFAULT_THEME,
    primaryColor: spec.theme.primaryColor.toLowerCase(),
    backgroundColor: spec.theme.backgroundColor.toLowerCase(),
  };

  const leadCapture: LeadCaptureConfig = {
    position: spec.leadCapture.position,
    title: spec.leadCapture.title,
    fields: DEFAULT_LEAD_CAPTURE.fields.map((field) =>
      field.key === "phone"
        ? { ...field, enabled: spec.leadCapture.askPhone, required: false }
        : field
    ),
    consent: {
      enabled: true,
      text: spec.leadCapture.consentText,
    },
  };

  const cta: CtaConfig = {
    type: spec.cta.type,
    label: spec.cta.label,
    value: spec.cta.value,
    whatsappMessage:
      spec.cta.whatsappMessage ||
      "Hola, completé el test {{funnel_name}} y mi resultado fue {{result_name}}. Quisiera recibir más información.",
    resultNote: spec.cta.resultNote ?? "",
  };

  await prisma.$transaction(async (tx) => {
    await tx.funnel.create({
      data: {
        id: funnelId,
        workspaceId: ctx.workspaceId,
        createdBy: ctx.userId,
        name: spec.name,
        slug,
        status: "DRAFT",
        goal: spec.goal || fallbacks?.goal,
        industry: spec.industry || fallbacks?.industry,
        audience: spec.audience || fallbacks?.audience,
        intro: {
          headline: spec.intro.headline,
          subheadline: spec.intro.subheadline,
          buttonText: spec.intro.buttonText,
        },
        theme,
        leadCapture,
        cta,
      },
    });

    await tx.question.createMany({
      data: spec.questions.map((q, i) => ({
        id: questionIds[i],
        funnelId,
        type: q.type,
        title: q.title,
        description: q.description,
        required: q.required,
        order: i + 1,
        settings:
          q.type === "SCALE"
            ? {
                scaleMin: 1,
                scaleMax: q.scaleMax ?? 5,
                scaleMinLabel: "",
                scaleMaxLabel: "",
              }
            : undefined,
      })),
    });

    const allOptions = spec.questions.flatMap((q, qi) =>
      q.options.map((option, oi) => ({
        id: optionIds[qi][oi],
        questionId: questionIds[qi],
        label: option.label,
        value: `opcion-${qi + 1}-${oi + 1}`,
        order: oi + 1,
      }))
    );
    if (allOptions.length > 0) {
      await tx.questionOption.createMany({ data: allOptions });
    }

    await tx.resultProfile.createMany({
      data: spec.profiles.map((profile, i) => ({
        id: profileIdByKey.get(profile.key)!,
        funnelId,
        key: profile.key,
        title: profile.title,
        description: profile.description,
        recommendation: profile.recommendation,
        order: i + 1,
      })),
    });

    if (spec.rules.length > 0) {
      await tx.logicRule.createMany({
        data: spec.rules.map((rule) => ({
          funnelId,
          questionId: questionIds[rule.questionIndex],
          optionId: optionIds[rule.questionIndex][rule.optionIndex],
          action: "ADD_SCORE" as const,
          targetProfileId: profileIdByKey.get(rule.profileKey)!,
          points: rule.points,
        })),
      });
    }
  });

  return funnelId;
}
