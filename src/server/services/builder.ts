import "server-only";

import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";
import type {
  CtaConfig,
  IntroConfig,
  LeadCaptureConfig,
  QuestionSettings,
  ThemeConfig,
} from "@/lib/funnel-config";
import type { QuestionType } from "@/generated/prisma/enums";

interface Ctx {
  userId: string;
  workspaceId: string;
}

const NOT_FOUND = { error: "Funnel no encontrado." as const };

/** Verifica pertenencia del funnel al workspace. Base de toda operación. */
async function getOwnedFunnelId(ctx: Ctx, funnelId: string) {
  const funnel = await prisma.funnel.findFirst({
    where: { id: funnelId, workspaceId: ctx.workspaceId },
    select: { id: true },
  });
  return funnel?.id ?? null;
}

async function touchFunnel(funnelId: string) {
  await prisma.funnel.update({
    where: { id: funnelId },
    data: { updatedAt: new Date() },
  });
}

// ── Secciones JSON (intro / theme / leadCapture / cta) ────
export async function updateFunnelSection(
  ctx: Ctx,
  funnelId: string,
  section:
    | { intro: IntroConfig }
    | { theme: ThemeConfig }
    | { leadCapture: LeadCaptureConfig }
    | { cta: CtaConfig }
) {
  if (!(await getOwnedFunnelId(ctx, funnelId))) return NOT_FOUND;
  await prisma.funnel.update({ where: { id: funnelId }, data: section });
  return { success: true as const };
}

// ── Preguntas ─────────────────────────────────────────────
const DEFAULT_OPTIONS_BY_TYPE: Partial<Record<QuestionType, string[]>> = {
  SINGLE_CHOICE: ["Opción 1", "Opción 2", "Opción 3"],
  MULTI_CHOICE: ["Opción 1", "Opción 2", "Opción 3"],
  YES_NO: ["Sí", "No"],
};

const DEFAULT_TITLE_BY_TYPE: Record<QuestionType, string> = {
  SINGLE_CHOICE: "¿Cuál de estas opciones te describe mejor?",
  MULTI_CHOICE: "¿Cuáles de estas opciones aplican? (varias posibles)",
  YES_NO: "¿Te interesa recibir una recomendación personalizada?",
  SCALE: "Del 1 al 5, ¿qué tan importante es esto para ti?",
  TEXT: "Cuéntanos un poco más",
  NUMBER: "¿Qué número corresponde?",
  EMAIL: "¿Cuál es tu email?",
  PHONE: "¿Cuál es tu teléfono?",
};

export async function addQuestion(ctx: Ctx, funnelId: string, type: QuestionType) {
  if (!(await getOwnedFunnelId(ctx, funnelId))) return NOT_FOUND;

  const max = await prisma.question.aggregate({
    where: { funnelId },
    _max: { order: true },
  });
  const order = (max._max.order ?? 0) + 1;
  const optionLabels = DEFAULT_OPTIONS_BY_TYPE[type] ?? [];

  const question = await prisma.question.create({
    data: {
      funnelId,
      type,
      title: DEFAULT_TITLE_BY_TYPE[type],
      required: true,
      order,
      settings:
        type === "SCALE"
          ? { scaleMin: 1, scaleMax: 5, scaleMinLabel: "", scaleMaxLabel: "" }
          : undefined,
      options: {
        create: optionLabels.map((label, i) => ({
          label,
          value: `${slugify(label) || "opcion"}-${i + 1}`,
          order: i + 1,
        })),
      },
    },
    include: { options: true },
  });
  await touchFunnel(funnelId);
  return { question };
}

export async function updateQuestion(
  ctx: Ctx,
  funnelId: string,
  questionId: string,
  data: {
    title?: string;
    description?: string | null;
    required?: boolean;
    settings?: QuestionSettings;
  }
) {
  if (!(await getOwnedFunnelId(ctx, funnelId))) return NOT_FOUND;
  const question = await prisma.question.findFirst({
    where: { id: questionId, funnelId },
    select: { id: true },
  });
  if (!question) return { error: "Pregunta no encontrada." as const };

  await prisma.question.update({
    where: { id: questionId },
    data: {
      ...data,
      settings: data.settings === undefined ? undefined : data.settings,
    },
  });
  await touchFunnel(funnelId);
  return { success: true as const };
}

export async function deleteQuestion(ctx: Ctx, funnelId: string, questionId: string) {
  if (!(await getOwnedFunnelId(ctx, funnelId))) return NOT_FOUND;
  const question = await prisma.question.findFirst({
    where: { id: questionId, funnelId },
    select: { id: true },
  });
  if (!question) return { error: "Pregunta no encontrada." as const };

  await prisma.$transaction(async (tx) => {
    // Reglas que apuntan a esta pregunta como destino de salto (sin FK).
    await tx.logicRule.deleteMany({
      where: { funnelId, targetQuestionId: questionId },
    });
    await tx.question.delete({ where: { id: questionId } });
    // Resecuencia los órdenes para mantenerlos compactos.
    const remaining = await tx.question.findMany({
      where: { funnelId },
      orderBy: { order: "asc" },
      select: { id: true },
    });
    for (let i = 0; i < remaining.length; i++) {
      await tx.question.update({
        where: { id: remaining[i].id },
        data: { order: i + 1 },
      });
    }
  });
  await touchFunnel(funnelId);
  return { success: true as const };
}

export async function duplicateQuestion(ctx: Ctx, funnelId: string, questionId: string) {
  if (!(await getOwnedFunnelId(ctx, funnelId))) return NOT_FOUND;
  const source = await prisma.question.findFirst({
    where: { id: questionId, funnelId },
    include: { options: { orderBy: { order: "asc" } } },
  });
  if (!source) return { error: "Pregunta no encontrada." as const };

  await prisma.$transaction(async (tx) => {
    // Hace hueco justo después de la original.
    await tx.question.updateMany({
      where: { funnelId, order: { gt: source.order } },
      data: { order: { increment: 1 } },
    });
    await tx.question.create({
      data: {
        funnelId,
        type: source.type,
        title: `${source.title} (copia)`,
        description: source.description,
        required: source.required,
        order: source.order + 1,
        settings: source.settings ?? undefined,
        options: {
          create: source.options.map((o) => ({
            label: o.label,
            value: o.value,
            order: o.order,
            imageUrl: o.imageUrl,
          })),
        },
      },
    });
  });
  await touchFunnel(funnelId);
  return { success: true as const };
}

export async function moveQuestion(
  ctx: Ctx,
  funnelId: string,
  questionId: string,
  direction: "up" | "down"
) {
  if (!(await getOwnedFunnelId(ctx, funnelId))) return NOT_FOUND;
  const questions = await prisma.question.findMany({
    where: { funnelId },
    orderBy: { order: "asc" },
    select: { id: true, order: true },
  });
  const idx = questions.findIndex((q) => q.id === questionId);
  if (idx === -1) return { error: "Pregunta no encontrada." as const };
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= questions.length) {
    return { success: true as const }; // ya está en el extremo
  }
  await prisma.$transaction([
    prisma.question.update({
      where: { id: questions[idx].id },
      data: { order: questions[swapIdx].order },
    }),
    prisma.question.update({
      where: { id: questions[swapIdx].id },
      data: { order: questions[idx].order },
    }),
  ]);
  await touchFunnel(funnelId);
  return { success: true as const };
}

// ── Opciones ──────────────────────────────────────────────
async function getOwnedQuestion(ctx: Ctx, funnelId: string, questionId: string) {
  if (!(await getOwnedFunnelId(ctx, funnelId))) return null;
  return prisma.question.findFirst({
    where: { id: questionId, funnelId },
    select: { id: true },
  });
}

export async function addOption(ctx: Ctx, funnelId: string, questionId: string) {
  const question = await getOwnedQuestion(ctx, funnelId, questionId);
  if (!question) return { error: "Pregunta no encontrada." as const };

  const max = await prisma.questionOption.aggregate({
    where: { questionId },
    _max: { order: true },
  });
  const order = (max._max.order ?? 0) + 1;
  await prisma.questionOption.create({
    data: {
      questionId,
      label: `Opción ${order}`,
      value: `opcion-${order}-${Date.now().toString(36)}`,
      order,
    },
  });
  await touchFunnel(funnelId);
  return { success: true as const };
}

export async function updateOption(
  ctx: Ctx,
  funnelId: string,
  questionId: string,
  optionId: string,
  data: { label: string }
) {
  const question = await getOwnedQuestion(ctx, funnelId, questionId);
  if (!question) return { error: "Pregunta no encontrada." as const };
  const option = await prisma.questionOption.findFirst({
    where: { id: optionId, questionId },
    select: { id: true },
  });
  if (!option) return { error: "Opción no encontrada." as const };

  await prisma.questionOption.update({
    where: { id: optionId },
    data: { label: data.label },
  });
  await touchFunnel(funnelId);
  return { success: true as const };
}

export async function deleteOption(
  ctx: Ctx,
  funnelId: string,
  questionId: string,
  optionId: string
) {
  const question = await getOwnedQuestion(ctx, funnelId, questionId);
  if (!question) return { error: "Pregunta no encontrada." as const };
  const option = await prisma.questionOption.findFirst({
    where: { id: optionId, questionId },
    select: { id: true },
  });
  if (!option) return { error: "Opción no encontrada." as const };

  await prisma.$transaction([
    prisma.logicRule.deleteMany({ where: { funnelId, optionId } }),
    prisma.questionOption.delete({ where: { id: optionId } }),
  ]);
  await touchFunnel(funnelId);
  return { success: true as const };
}

// ── Perfiles de resultado ─────────────────────────────────
export async function addProfile(ctx: Ctx, funnelId: string) {
  if (!(await getOwnedFunnelId(ctx, funnelId))) return NOT_FOUND;
  const max = await prisma.resultProfile.aggregate({
    where: { funnelId },
    _max: { order: true },
  });
  const order = (max._max.order ?? 0) + 1;
  const profile = await prisma.resultProfile.create({
    data: {
      funnelId,
      key: `perfil-${order}-${Date.now().toString(36)}`,
      title: `Perfil ${String.fromCharCode(64 + order)}`,
      description: "",
      recommendation: "",
      order,
    },
  });
  await touchFunnel(funnelId);
  return { profile };
}

export async function updateProfile(
  ctx: Ctx,
  funnelId: string,
  profileId: string,
  data: {
    title?: string;
    description?: string | null;
    recommendation?: string | null;
    imageUrl?: string | null;
  }
) {
  if (!(await getOwnedFunnelId(ctx, funnelId))) return NOT_FOUND;
  const profile = await prisma.resultProfile.findFirst({
    where: { id: profileId, funnelId },
    select: { id: true },
  });
  if (!profile) return { error: "Perfil no encontrado." as const };

  await prisma.resultProfile.update({ where: { id: profileId }, data });
  await touchFunnel(funnelId);
  return { success: true as const };
}

export async function deleteProfile(ctx: Ctx, funnelId: string, profileId: string) {
  if (!(await getOwnedFunnelId(ctx, funnelId))) return NOT_FOUND;
  const profile = await prisma.resultProfile.findFirst({
    where: { id: profileId, funnelId },
    select: { id: true },
  });
  if (!profile) return { error: "Perfil no encontrado." as const };

  await prisma.$transaction([
    prisma.logicRule.deleteMany({ where: { funnelId, targetProfileId: profileId } }),
    prisma.resultProfile.delete({ where: { id: profileId } }),
  ]);
  await touchFunnel(funnelId);
  return { success: true as const };
}

// ── Reglas de lógica ──────────────────────────────────────
export async function addRule(
  ctx: Ctx,
  funnelId: string,
  data:
    | {
        action: "ADD_SCORE";
        questionId: string;
        optionId: string;
        targetProfileId: string;
        points: number;
      }
    | {
        action: "GOTO_QUESTION";
        questionId: string;
        optionId: string;
        targetQuestionId: string;
      }
) {
  if (!(await getOwnedFunnelId(ctx, funnelId))) return NOT_FOUND;

  // Valida que todas las referencias pertenezcan al funnel.
  const option = await prisma.questionOption.findFirst({
    where: { id: data.optionId, question: { id: data.questionId, funnelId } },
    select: { id: true },
  });
  if (!option) return { error: "La opción no pertenece a este funnel." as const };

  if (data.action === "ADD_SCORE") {
    const profile = await prisma.resultProfile.findFirst({
      where: { id: data.targetProfileId, funnelId },
      select: { id: true },
    });
    if (!profile) return { error: "El perfil no pertenece a este funnel." as const };
    await prisma.logicRule.create({
      data: {
        funnelId,
        questionId: data.questionId,
        optionId: data.optionId,
        action: "ADD_SCORE",
        targetProfileId: data.targetProfileId,
        points: data.points,
      },
    });
  } else {
    const target = await prisma.question.findFirst({
      where: { id: data.targetQuestionId, funnelId },
      select: { id: true },
    });
    if (!target) return { error: "La pregunta destino no pertenece a este funnel." as const };
    if (data.targetQuestionId === data.questionId) {
      return { error: "El salto no puede apuntar a la misma pregunta." as const };
    }
    await prisma.logicRule.create({
      data: {
        funnelId,
        questionId: data.questionId,
        optionId: data.optionId,
        action: "GOTO_QUESTION",
        targetQuestionId: data.targetQuestionId,
      },
    });
  }
  await touchFunnel(funnelId);
  return { success: true as const };
}

export async function deleteRule(ctx: Ctx, funnelId: string, ruleId: string) {
  if (!(await getOwnedFunnelId(ctx, funnelId))) return NOT_FOUND;
  const rule = await prisma.logicRule.findFirst({
    where: { id: ruleId, funnelId },
    select: { id: true },
  });
  if (!rule) return { error: "Regla no encontrada." as const };
  await prisma.logicRule.delete({ where: { id: ruleId } });
  await touchFunnel(funnelId);
  return { success: true as const };
}
