import { z } from "zod";

/**
 * Schemas compartidos de la configuración de un funnel.
 * Los usan: el builder (editar draft), el compilador de snapshots
 * (publicación), el preview y el runner público. La IA (Fase 7) deberá
 * producir datos que validen contra estos mismos schemas.
 */

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

// ── Intro ─────────────────────────────────────────────────
export const introSchema = z.object({
  headline: z.string().trim().min(1).max(120),
  subheadline: z.string().trim().max(220).default(""),
  buttonText: z.string().trim().min(1).max(40),
});
export type IntroConfig = z.infer<typeof introSchema>;

export const DEFAULT_INTRO: IntroConfig = {
  headline: "Descubre lo que necesitas en 2 minutos",
  subheadline:
    "Responde unas preguntas rápidas y recibe una recomendación personalizada.",
  buttonText: "Empezar",
};

// ── Tema ──────────────────────────────────────────────────
export const FONT_OPTIONS = [
  { value: "sans", label: "Moderna (sans-serif)" },
  { value: "serif", label: "Elegante (serif)" },
  { value: "mono", label: "Técnica (mono)" },
] as const;

export const themeSchema = z.object({
  logoUrl: z
    .union([z.string().trim().url().max(500), z.literal("")])
    .default(""),
  primaryColor: z.string().regex(HEX_COLOR).default("#171717"),
  backgroundColor: z.string().regex(HEX_COLOR).default("#ffffff"),
  font: z.enum(["sans", "serif", "mono"]).default("sans"),
  buttonRadius: z.enum(["md", "full"]).default("md"),
});
export type ThemeConfig = z.infer<typeof themeSchema>;

export const DEFAULT_THEME: ThemeConfig = {
  logoUrl: "",
  primaryColor: "#171717",
  backgroundColor: "#ffffff",
  font: "sans",
  buttonRadius: "md",
};

// ── Lead capture ──────────────────────────────────────────
export const LEAD_FIELD_KEYS = ["name", "email", "phone", "city"] as const;
export type LeadFieldKey = (typeof LEAD_FIELD_KEYS)[number];

const leadFieldSchema = z.object({
  key: z.enum(LEAD_FIELD_KEYS),
  label: z.string().trim().min(1).max(40),
  enabled: z.boolean(),
  required: z.boolean(),
});

export const leadCaptureSchema = z.object({
  position: z.enum(["before_result", "after_result"]).default("before_result"),
  title: z.string().trim().min(1).max(120).default("Ya casi está — ¿dónde te enviamos tu resultado?"),
  fields: z.array(leadFieldSchema).default([]),
  consent: z
    .object({
      enabled: z.boolean().default(true),
      text: z
        .string()
        .trim()
        .min(1)
        .max(300)
        .default("Acepto recibir información sobre este servicio."),
    })
    .default({ enabled: true, text: "Acepto recibir información sobre este servicio." }),
});
export type LeadCaptureConfig = z.infer<typeof leadCaptureSchema>;

export const DEFAULT_LEAD_CAPTURE: LeadCaptureConfig = {
  position: "before_result",
  title: "Ya casi está — ¿dónde te enviamos tu resultado?",
  fields: [
    { key: "name", label: "Nombre", enabled: true, required: true },
    { key: "email", label: "Email", enabled: true, required: true },
    { key: "phone", label: "Teléfono", enabled: false, required: false },
    { key: "city", label: "Ciudad", enabled: false, required: false },
  ],
  consent: {
    enabled: true,
    text: "Acepto recibir información sobre este servicio.",
  },
};

// ── CTA ───────────────────────────────────────────────────
export const CTA_TYPES = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "url", label: "Visitar página (URL)" },
  { value: "booking", label: "Reservar cita" },
  { value: "purchase", label: "Comprar" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Llamada telefónica" },
] as const;

export const ctaSchema = z.object({
  type: z
    .enum(["whatsapp", "url", "booking", "purchase", "email", "phone"])
    .default("url"),
  label: z.string().trim().min(1).max(60).default("Más información"),
  /** Número (whatsapp/phone), email o URL según el tipo. */
  value: z.string().trim().max(500).default(""),
  whatsappMessage: z
    .string()
    .trim()
    .max(500)
    .default(
      "Hola, completé el test {{funnel_name}} y mi resultado fue {{result_name}}. Quisiera recibir más información."
    ),
});
export type CtaConfig = z.infer<typeof ctaSchema>;

export const DEFAULT_CTA: CtaConfig = ctaSchema.parse({});

// ── Snapshot compilado (forma de FunnelVersion.snapshot) ──
export const questionTypeEnum = z.enum([
  "SINGLE_CHOICE",
  "MULTI_CHOICE",
  "YES_NO",
  "SCALE",
  "TEXT",
  "NUMBER",
  "EMAIL",
  "PHONE",
]);
export type QuestionTypeValue = z.infer<typeof questionTypeEnum>;

export const QUESTION_TYPE_LABELS: Record<QuestionTypeValue, string> = {
  SINGLE_CHOICE: "Selección única",
  MULTI_CHOICE: "Selección múltiple",
  YES_NO: "Sí / No",
  SCALE: "Escala",
  TEXT: "Texto",
  NUMBER: "Número",
  EMAIL: "Email",
  PHONE: "Teléfono",
};

export const questionSettingsSchema = z
  .object({
    scaleMin: z.number().int().min(0).max(10).default(1),
    scaleMax: z.number().int().min(1).max(10).default(5),
    scaleMinLabel: z.string().max(40).default(""),
    scaleMaxLabel: z.string().max(40).default(""),
    placeholder: z.string().max(80).default(""),
  })
  .partial();
export type QuestionSettings = z.infer<typeof questionSettingsSchema>;

const snapshotOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  order: z.number().int(),
  imageUrl: z.string().nullable().optional(),
});

const snapshotQuestionSchema = z.object({
  id: z.string(),
  type: questionTypeEnum,
  title: z.string(),
  description: z.string().nullable().optional(),
  required: z.boolean(),
  order: z.number().int(),
  settings: questionSettingsSchema.nullable().optional(),
  options: z.array(snapshotOptionSchema),
});
export type SnapshotQuestion = z.infer<typeof snapshotQuestionSchema>;

const snapshotProfileSchema = z.object({
  id: z.string(),
  key: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  recommendation: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  ctaOverride: ctaSchema.nullable().optional(),
  order: z.number().int(),
});
export type SnapshotProfile = z.infer<typeof snapshotProfileSchema>;

const snapshotRuleSchema = z.object({
  id: z.string(),
  questionId: z.string(),
  optionId: z.string().nullable().optional(),
  action: z.enum(["ADD_SCORE", "GOTO_QUESTION"]),
  targetProfileId: z.string().nullable().optional(),
  points: z.number().int().nullable().optional(),
  targetQuestionId: z.string().nullable().optional(),
});
export type SnapshotRule = z.infer<typeof snapshotRuleSchema>;

export const funnelSnapshotSchema = z.object({
  funnelId: z.string(),
  name: z.string(),
  slug: z.string(),
  intro: introSchema,
  theme: themeSchema,
  leadCapture: leadCaptureSchema,
  cta: ctaSchema,
  questions: z.array(snapshotQuestionSchema),
  profiles: z.array(snapshotProfileSchema),
  rules: z.array(snapshotRuleSchema),
});
export type FunnelSnapshot = z.infer<typeof funnelSnapshotSchema>;

// ── Parsers resilientes (JSON de DB → config con defaults) ─
export function parseIntro(value: unknown): IntroConfig {
  const result = introSchema.safeParse(value);
  return result.success ? result.data : DEFAULT_INTRO;
}

export function parseTheme(value: unknown): ThemeConfig {
  const result = themeSchema.safeParse(value);
  return result.success ? result.data : DEFAULT_THEME;
}

export function parseLeadCapture(value: unknown): LeadCaptureConfig {
  const result = leadCaptureSchema.safeParse(value);
  if (!result.success) return DEFAULT_LEAD_CAPTURE;
  // Garantiza que estén los 4 campos posibles, en orden estable.
  const byKey = new Map(result.data.fields.map((f) => [f.key, f]));
  return {
    ...result.data,
    fields: DEFAULT_LEAD_CAPTURE.fields.map(
      (def) => byKey.get(def.key) ?? def
    ),
  };
}

export function parseCta(value: unknown): CtaConfig {
  const result = ctaSchema.safeParse(value);
  return result.success ? result.data : DEFAULT_CTA;
}

/** Construye la URL de WhatsApp con el mensaje interpolado. */
export function buildWhatsappUrl(
  phone: string,
  template: string,
  vars: { funnel_name: string; result_name: string }
): string {
  const message = template
    .replaceAll("{{funnel_name}}", vars.funnel_name)
    .replaceAll("{{result_name}}", vars.result_name);
  const digits = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
