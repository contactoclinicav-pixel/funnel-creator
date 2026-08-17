"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireWorkspace } from "@/server/context";
import { generateFunnelWithAI } from "@/server/services/ai-generator";

const briefSchema = z.object({
  businessType: z
    .string()
    .trim()
    .min(3, "Cuéntanos qué tipo de negocio tienes.")
    .max(300),
  goal: z.string().trim().min(3).max(120),
  product: z
    .string()
    .trim()
    .min(3, "Describe el producto o servicio a promocionar.")
    .max(400),
  audience: z.string().trim().min(3, "Describe a tu público.").max(400),
  finalAction: z.string().trim().min(3).max(120),
  additionalInfo: z.string().trim().max(2000).optional(),
});

export async function generateFunnelAction(input: unknown) {
  const ctx = await requireWorkspace();
  const parsed = briefSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const result = await generateFunnelWithAI(ctx, parsed.data);
  if ("error" in result) {
    return { error: result.error };
  }

  revalidatePath("/funnels");
  revalidatePath("/dashboard");
  return { funnelId: result.funnelId };
}
