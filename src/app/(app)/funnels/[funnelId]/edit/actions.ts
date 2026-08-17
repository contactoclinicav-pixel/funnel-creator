"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  ctaSchema,
  introSchema,
  leadCaptureSchema,
  questionSettingsSchema,
  themeSchema,
} from "@/lib/funnel-config";
import { requireWorkspace } from "@/server/context";
import * as builder from "@/server/services/builder";
import type { QuestionType } from "@/generated/prisma/enums";

function revalidate(funnelId: string) {
  revalidatePath(`/funnels/${funnelId}/edit`);
}

type ActionResult = { success?: boolean; error?: string };

// ── Secciones ─────────────────────────────────────────────
const sectionInput = z.object({ funnelId: z.string().min(1) });

export async function updateIntroAction(input: {
  funnelId: string;
  intro: unknown;
}): Promise<ActionResult> {
  const ctx = await requireWorkspace();
  const base = sectionInput.safeParse(input);
  const intro = introSchema.safeParse(input.intro);
  if (!base.success || !intro.success) {
    return { error: intro.success ? "Solicitud inválida." : intro.error.issues[0].message };
  }
  const result = await builder.updateFunnelSection(ctx, base.data.funnelId, {
    intro: intro.data,
  });
  if ("error" in result) return result;
  revalidate(base.data.funnelId);
  return { success: true };
}

export async function updateThemeAction(input: {
  funnelId: string;
  theme: unknown;
}): Promise<ActionResult> {
  const ctx = await requireWorkspace();
  const base = sectionInput.safeParse(input);
  const theme = themeSchema.safeParse(input.theme);
  if (!base.success || !theme.success) {
    return { error: theme.success ? "Solicitud inválida." : theme.error.issues[0].message };
  }
  const result = await builder.updateFunnelSection(ctx, base.data.funnelId, {
    theme: theme.data,
  });
  if ("error" in result) return result;
  revalidate(base.data.funnelId);
  return { success: true };
}

export async function updateLeadCaptureAction(input: {
  funnelId: string;
  leadCapture: unknown;
}): Promise<ActionResult> {
  const ctx = await requireWorkspace();
  const base = sectionInput.safeParse(input);
  const leadCapture = leadCaptureSchema.safeParse(input.leadCapture);
  if (!base.success || !leadCapture.success) {
    return {
      error: leadCapture.success
        ? "Solicitud inválida."
        : leadCapture.error.issues[0].message,
    };
  }
  const result = await builder.updateFunnelSection(ctx, base.data.funnelId, {
    leadCapture: leadCapture.data,
  });
  if ("error" in result) return result;
  revalidate(base.data.funnelId);
  return { success: true };
}

export async function updateCtaAction(input: {
  funnelId: string;
  cta: unknown;
}): Promise<ActionResult> {
  const ctx = await requireWorkspace();
  const base = sectionInput.safeParse(input);
  const cta = ctaSchema.safeParse(input.cta);
  if (!base.success || !cta.success) {
    return { error: cta.success ? "Solicitud inválida." : cta.error.issues[0].message };
  }
  const result = await builder.updateFunnelSection(ctx, base.data.funnelId, {
    cta: cta.data,
  });
  if ("error" in result) return result;
  revalidate(base.data.funnelId);
  return { success: true };
}

// ── Preguntas ─────────────────────────────────────────────
const QUESTION_TYPES: QuestionType[] = [
  "SINGLE_CHOICE",
  "MULTI_CHOICE",
  "YES_NO",
  "SCALE",
  "TEXT",
  "NUMBER",
  "EMAIL",
  "PHONE",
];

const addQuestionInput = z.object({
  funnelId: z.string().min(1),
  type: z.enum(QUESTION_TYPES as [QuestionType, ...QuestionType[]]),
});

export async function addQuestionAction(input: {
  funnelId: string;
  type: string;
}): Promise<ActionResult> {
  const ctx = await requireWorkspace();
  const parsed = addQuestionInput.safeParse(input);
  if (!parsed.success) return { error: "Tipo de pregunta inválido." };
  const result = await builder.addQuestion(ctx, parsed.data.funnelId, parsed.data.type);
  if ("error" in result) return { error: result.error };
  revalidate(parsed.data.funnelId);
  return { success: true };
}

const updateQuestionInput = z.object({
  funnelId: z.string().min(1),
  questionId: z.string().min(1),
  title: z.string().trim().min(1, "El título es obligatorio.").max(200),
  description: z
    .string()
    .trim()
    .max(300)
    .transform((v) => (v === "" ? null : v)),
  required: z.boolean(),
  settings: questionSettingsSchema.optional(),
});

export async function updateQuestionAction(
  input: z.input<typeof updateQuestionInput>
): Promise<ActionResult> {
  const ctx = await requireWorkspace();
  const parsed = updateQuestionInput.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { funnelId, questionId, ...data } = parsed.data;
  const result = await builder.updateQuestion(ctx, funnelId, questionId, data);
  if ("error" in result) return { error: result.error };
  revalidate(funnelId);
  return { success: true };
}

const questionRefInput = z.object({
  funnelId: z.string().min(1),
  questionId: z.string().min(1),
});

export async function deleteQuestionAction(input: {
  funnelId: string;
  questionId: string;
}): Promise<ActionResult> {
  const ctx = await requireWorkspace();
  const parsed = questionRefInput.safeParse(input);
  if (!parsed.success) return { error: "Solicitud inválida." };
  const result = await builder.deleteQuestion(ctx, parsed.data.funnelId, parsed.data.questionId);
  if ("error" in result) return { error: result.error };
  revalidate(parsed.data.funnelId);
  return { success: true };
}

export async function duplicateQuestionAction(input: {
  funnelId: string;
  questionId: string;
}): Promise<ActionResult> {
  const ctx = await requireWorkspace();
  const parsed = questionRefInput.safeParse(input);
  if (!parsed.success) return { error: "Solicitud inválida." };
  const result = await builder.duplicateQuestion(ctx, parsed.data.funnelId, parsed.data.questionId);
  if ("error" in result) return { error: result.error };
  revalidate(parsed.data.funnelId);
  return { success: true };
}

const moveQuestionInput = questionRefInput.extend({
  direction: z.enum(["up", "down"]),
});

export async function moveQuestionAction(input: {
  funnelId: string;
  questionId: string;
  direction: "up" | "down";
}): Promise<ActionResult> {
  const ctx = await requireWorkspace();
  const parsed = moveQuestionInput.safeParse(input);
  if (!parsed.success) return { error: "Solicitud inválida." };
  const result = await builder.moveQuestion(
    ctx,
    parsed.data.funnelId,
    parsed.data.questionId,
    parsed.data.direction
  );
  if ("error" in result) return { error: result.error };
  revalidate(parsed.data.funnelId);
  return { success: true };
}

// ── Opciones ──────────────────────────────────────────────
export async function addOptionAction(input: {
  funnelId: string;
  questionId: string;
}): Promise<ActionResult> {
  const ctx = await requireWorkspace();
  const parsed = questionRefInput.safeParse(input);
  if (!parsed.success) return { error: "Solicitud inválida." };
  const result = await builder.addOption(ctx, parsed.data.funnelId, parsed.data.questionId);
  if ("error" in result) return { error: result.error };
  revalidate(parsed.data.funnelId);
  return { success: true };
}

const optionRefInput = questionRefInput.extend({
  optionId: z.string().min(1),
});

export async function updateOptionAction(input: {
  funnelId: string;
  questionId: string;
  optionId: string;
  label: string;
}): Promise<ActionResult> {
  const ctx = await requireWorkspace();
  const parsed = optionRefInput
    .extend({ label: z.string().trim().min(1, "La opción no puede estar vacía.").max(120) })
    .safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const result = await builder.updateOption(
    ctx,
    parsed.data.funnelId,
    parsed.data.questionId,
    parsed.data.optionId,
    { label: parsed.data.label }
  );
  if ("error" in result) return { error: result.error };
  revalidate(parsed.data.funnelId);
  return { success: true };
}

export async function deleteOptionAction(input: {
  funnelId: string;
  questionId: string;
  optionId: string;
}): Promise<ActionResult> {
  const ctx = await requireWorkspace();
  const parsed = optionRefInput.safeParse(input);
  if (!parsed.success) return { error: "Solicitud inválida." };
  const result = await builder.deleteOption(
    ctx,
    parsed.data.funnelId,
    parsed.data.questionId,
    parsed.data.optionId
  );
  if ("error" in result) return { error: result.error };
  revalidate(parsed.data.funnelId);
  return { success: true };
}

// ── Perfiles ──────────────────────────────────────────────
export async function addProfileAction(input: {
  funnelId: string;
}): Promise<ActionResult> {
  const ctx = await requireWorkspace();
  const parsed = sectionInput.safeParse(input);
  if (!parsed.success) return { error: "Solicitud inválida." };
  const result = await builder.addProfile(ctx, parsed.data.funnelId);
  if ("error" in result) return { error: result.error };
  revalidate(parsed.data.funnelId);
  return { success: true };
}

const updateProfileInput = z.object({
  funnelId: z.string().min(1),
  profileId: z.string().min(1),
  title: z.string().trim().min(1, "El título es obligatorio.").max(120),
  description: z.string().trim().max(600).transform((v) => (v === "" ? null : v)),
  recommendation: z.string().trim().max(600).transform((v) => (v === "" ? null : v)),
  imageUrl: z
    .union([z.string().trim().url("La imagen debe ser una URL válida.").max(500), z.literal("")])
    .transform((v) => (v === "" ? null : v)),
});

export async function updateProfileAction(
  input: z.input<typeof updateProfileInput>
): Promise<ActionResult> {
  const ctx = await requireWorkspace();
  const parsed = updateProfileInput.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { funnelId, profileId, ...data } = parsed.data;
  const result = await builder.updateProfile(ctx, funnelId, profileId, data);
  if ("error" in result) return { error: result.error };
  revalidate(funnelId);
  return { success: true };
}

export async function deleteProfileAction(input: {
  funnelId: string;
  profileId: string;
}): Promise<ActionResult> {
  const ctx = await requireWorkspace();
  const parsed = z
    .object({ funnelId: z.string().min(1), profileId: z.string().min(1) })
    .safeParse(input);
  if (!parsed.success) return { error: "Solicitud inválida." };
  const result = await builder.deleteProfile(ctx, parsed.data.funnelId, parsed.data.profileId);
  if ("error" in result) return { error: result.error };
  revalidate(parsed.data.funnelId);
  return { success: true };
}

// ── Reglas de lógica ──────────────────────────────────────
const addRuleInput = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("ADD_SCORE"),
    funnelId: z.string().min(1),
    questionId: z.string().min(1),
    optionId: z.string().min(1),
    targetProfileId: z.string().min(1),
    points: z.coerce.number().int().min(-100).max(100),
  }),
  z.object({
    action: z.literal("GOTO_QUESTION"),
    funnelId: z.string().min(1),
    questionId: z.string().min(1),
    optionId: z.string().min(1),
    targetQuestionId: z.string().min(1),
  }),
]);

export async function addRuleAction(
  input: z.input<typeof addRuleInput>
): Promise<ActionResult> {
  const ctx = await requireWorkspace();
  const parsed = addRuleInput.safeParse(input);
  if (!parsed.success) return { error: "Completa todos los campos de la regla." };
  const { funnelId, ...data } = parsed.data;
  const result = await builder.addRule(ctx, funnelId, data);
  if ("error" in result) return { error: result.error };
  revalidate(funnelId);
  return { success: true };
}

export async function deleteRuleAction(input: {
  funnelId: string;
  ruleId: string;
}): Promise<ActionResult> {
  const ctx = await requireWorkspace();
  const parsed = z
    .object({ funnelId: z.string().min(1), ruleId: z.string().min(1) })
    .safeParse(input);
  if (!parsed.success) return { error: "Solicitud inválida." };
  const result = await builder.deleteRule(ctx, parsed.data.funnelId, parsed.data.ruleId);
  if ("error" in result) return { error: result.error };
  revalidate(parsed.data.funnelId);
  return { success: true };
}
