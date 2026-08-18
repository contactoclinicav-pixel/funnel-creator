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
import { rateLimit } from "@/lib/rate-limit";
import { getAIProvider } from "@/server/ai/anthropic-provider";
import { AIGenerationError } from "@/server/ai/provider";
import type {
  FunnelGeneration,
  GenerationBrief,
} from "@/server/ai/generation-schema";
import { generateUniqueSlug } from "@/server/services/funnel";

interface Ctx {
  userId: string;
  workspaceId: string;
}

/**
 * Orquesta la generación: llama al proveedor de IA, y solo si la salida es
 * válida y coherente crea el funnel completo en una transacción.
 * Si algo falla, no se persiste nada (nunca funnels incompletos).
 */
export async function generateFunnelWithAI(ctx: Ctx, brief: GenerationBrief) {
  if (!rateLimit(`ai-generate:${ctx.userId}`, 10, 60 * 60 * 1000).allowed) {
    return {
      error:
        "Has alcanzado el límite de generaciones por hora. Espera un poco e inténtalo de nuevo.",
    };
  }

  let generation: FunnelGeneration;
  try {
    const provider = getAIProvider();
    generation = await provider.generateFunnel(brief);
  } catch (error) {
    if (error instanceof AIGenerationError) {
      return { error: error.message };
    }
    console.error("[ai] Error inesperado generando funnel:", error);
    return { error: "Ocurrió un error inesperado. Inténtalo de nuevo." };
  }

  const funnelId = await createFunnelFromGeneration(ctx, generation, brief);
  return { funnelId };
}

async function createFunnelFromGeneration(
  ctx: Ctx,
  generation: FunnelGeneration,
  brief: GenerationBrief
): Promise<string> {
  const slug = await generateUniqueSlug(generation.name);
  const funnelId = randomUUID();

  // Pre-genera ids para poder mapear las referencias por índice/key de la IA.
  const questionIds = generation.questions.map(() => randomUUID());
  const optionIds = generation.questions.map((q) => q.options.map(() => randomUUID()));
  const profileIdByKey = new Map(
    generation.profiles.map((p) => [p.key, randomUUID()])
  );

  const theme: ThemeConfig = {
    ...DEFAULT_THEME,
    primaryColor: generation.theme.primaryColor.toLowerCase(),
    backgroundColor: generation.theme.backgroundColor.toLowerCase(),
  };

  const leadCapture: LeadCaptureConfig = {
    position: generation.leadCapture.position,
    title: generation.leadCapture.title,
    fields: DEFAULT_LEAD_CAPTURE.fields.map((field) =>
      field.key === "phone"
        ? {
            ...field,
            enabled: generation.leadCapture.askPhone,
            required: false,
          }
        : field
    ),
    consent: {
      enabled: true,
      text: generation.leadCapture.consentText,
    },
  };

  const cta: CtaConfig = {
    type: generation.cta.type,
    label: generation.cta.label,
    value: generation.cta.value,
    whatsappMessage:
      generation.cta.whatsappMessage ||
      "Hola, completé el test {{funnel_name}} y mi resultado fue {{result_name}}. Quisiera recibir más información.",
    resultNote: generation.cta.resultNote ?? "",
  };

  await prisma.$transaction(async (tx) => {
    await tx.funnel.create({
      data: {
        id: funnelId,
        workspaceId: ctx.workspaceId,
        createdBy: ctx.userId,
        name: generation.name,
        slug,
        status: "DRAFT",
        goal: generation.goal || brief.goal,
        industry: generation.industry || brief.businessType,
        audience: generation.audience || brief.audience,
        intro: {
          headline: generation.intro.headline,
          subheadline: generation.intro.subheadline,
          buttonText: generation.intro.buttonText,
        },
        theme,
        leadCapture,
        cta,
      },
    });

    await tx.question.createMany({
      data: generation.questions.map((q, i) => ({
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

    const allOptions = generation.questions.flatMap((q, qi) =>
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
      data: generation.profiles.map((profile, i) => ({
        id: profileIdByKey.get(profile.key)!,
        funnelId,
        key: profile.key,
        title: profile.title,
        description: profile.description,
        recommendation: profile.recommendation,
        order: i + 1,
      })),
    });

    if (generation.rules.length > 0) {
      await tx.logicRule.createMany({
        data: generation.rules.map((rule) => ({
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
