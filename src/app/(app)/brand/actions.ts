"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/server/context";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

const brandSchema = z.object({
  businessName: optionalText(120),
  logoUrl: z
    .union([z.string().trim().url("La URL del logo no es válida.").max(500), z.literal("")])
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  primaryColor: z
    .union([z.string().trim().regex(HEX_COLOR, "Color hex inválido."), z.literal("")])
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  secondaryColor: z
    .union([z.string().trim().regex(HEX_COLOR, "Color hex inválido."), z.literal("")])
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  font: optionalText(40),
  website: z
    .union([z.string().trim().url("La URL no es válida.").max(300), z.literal("")])
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  whatsapp: optionalText(30),
  email: z
    .union([z.string().trim().email("El email no es válido.").max(200), z.literal("")])
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
});

export async function updateBrandAction(formData: FormData) {
  const ctx = await requireWorkspace();
  const parsed = brandSchema.safeParse({
    businessName: formData.get("businessName"),
    logoUrl: formData.get("logoUrl"),
    primaryColor: formData.get("primaryColor"),
    secondaryColor: formData.get("secondaryColor"),
    font: formData.get("font"),
    website: formData.get("website"),
    whatsapp: formData.get("whatsapp"),
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await prisma.brandSettings.upsert({
    where: { workspaceId: ctx.workspaceId },
    create: { workspaceId: ctx.workspaceId, ...parsed.data },
    update: parsed.data,
  });

  revalidatePath("/brand");
  revalidatePath("/settings");
  return { success: true };
}
