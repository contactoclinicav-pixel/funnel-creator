"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/server/admin-context";
import { updateWorkspacePlan } from "@/server/services/plan";

const schema = z.object({
  workspaceId: z.string().min(1),
  plan: z.enum(["FREE", "START", "GROWTH", "AGENCY"]),
  note: z.string().max(500).optional(),
});

export async function updateWorkspacePlanAction(formData: FormData) {
  await requireAdmin();
  const parsed = schema.safeParse({
    workspaceId: formData.get("workspaceId"),
    plan: formData.get("plan"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) return;

  await updateWorkspacePlan(parsed.data.workspaceId, parsed.data.plan, parsed.data.note);
  revalidatePath("/admin/workspaces");
}
