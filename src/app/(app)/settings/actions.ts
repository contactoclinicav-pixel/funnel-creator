"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireWorkspace } from "@/server/context";
import { renameWorkspace } from "@/server/services/workspace";

const workspaceNameSchema = z
  .string()
  .trim()
  .min(2, "El nombre debe tener al menos 2 caracteres.")
  .max(80, "El nombre no puede superar 80 caracteres.");

export async function updateWorkspaceNameAction(formData: FormData) {
  const ctx = await requireWorkspace();
  if (ctx.role !== "OWNER" && ctx.role !== "ADMIN") {
    return { error: "No tienes permisos para renombrar el workspace." };
  }

  const parsed = workspaceNameSchema.safeParse(formData.get("name"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await renameWorkspace(ctx, parsed.data);
  revalidatePath("/", "layout");
  return { success: true };
}
