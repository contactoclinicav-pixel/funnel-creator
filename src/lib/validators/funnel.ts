import { z } from "zod";

import { SLUG_PATTERN } from "@/lib/slug";

export const funnelNameSchema = z
  .string()
  .trim()
  .min(2, "El nombre debe tener al menos 2 caracteres.")
  .max(80, "El nombre no puede superar 80 caracteres.");

export const funnelSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "La URL debe tener al menos 2 caracteres.")
  .max(60, "La URL no puede superar 60 caracteres.")
  .regex(
    SLUG_PATTERN,
    "Solo minúsculas, números y guiones (sin espacios ni acentos)."
  );

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres.`)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

export const createFunnelSchema = z.object({
  name: funnelNameSchema,
  applyBrand: z.boolean().optional(),
});

export const updateFunnelSettingsSchema = z.object({
  funnelId: z.string().min(1),
  name: funnelNameSchema,
  slug: funnelSlugSchema,
  goal: optionalText(200),
  industry: optionalText(120),
  audience: optionalText(200),
});

export const funnelIdSchema = z.object({
  funnelId: z.string().min(1),
});
