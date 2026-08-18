"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireWorkspace } from "@/server/context";
import { createFunnelFromTemplate } from "@/server/services/template";

const schema = z.object({ templateId: z.string().min(1) });

export async function applyTemplateAction(formData: FormData) {
  const ctx = await requireWorkspace();
  const parsed = schema.safeParse({ templateId: formData.get("templateId") });
  if (!parsed.success) {
    return { error: "Solicitud inválida." };
  }

  const result = await createFunnelFromTemplate(ctx, parsed.data.templateId);
  if ("error" in result) {
    return { error: result.error };
  }

  revalidatePath("/funnels");
  redirect(`/funnels/${result.funnelId}/edit`);
}
