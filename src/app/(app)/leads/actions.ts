"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireWorkspace } from "@/server/context";
import {
  addLeadNote,
  deleteLeadWithData,
  updateLeadStatus,
} from "@/server/services/lead";

const statusSchema = z.object({
  leadId: z.string().min(1),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"]),
});

export async function updateLeadStatusAction(input: {
  leadId: string;
  status: string;
}) {
  const ctx = await requireWorkspace();
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return { error: "Solicitud inválida." };
  const result = await updateLeadStatus(ctx, parsed.data.leadId, parsed.data.status);
  if ("error" in result) return { error: result.error };
  revalidatePath("/leads");
  revalidatePath(`/leads/${parsed.data.leadId}`);
  return { success: true };
}

const noteSchema = z.object({
  leadId: z.string().min(1),
  body: z
    .string()
    .trim()
    .min(1, "La nota no puede estar vacía.")
    .max(2000, "Máximo 2000 caracteres."),
});

export async function addLeadNoteAction(input: { leadId: string; body: string }) {
  const ctx = await requireWorkspace();
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const result = await addLeadNote(ctx, parsed.data.leadId, parsed.data.body);
  if ("error" in result) return { error: result.error };
  revalidatePath(`/leads/${parsed.data.leadId}`);
  return { success: true };
}

const deleteSchema = z.object({ leadId: z.string().min(1) });

export async function deleteLeadAction(input: { leadId: string }) {
  const ctx = await requireWorkspace();
  const parsed = deleteSchema.safeParse(input);
  if (!parsed.success) return { error: "Solicitud inválida." };
  const result = await deleteLeadWithData(ctx, parsed.data.leadId);
  if ("error" in result) return { error: result.error };
  revalidatePath("/leads");
  redirect("/leads");
}
