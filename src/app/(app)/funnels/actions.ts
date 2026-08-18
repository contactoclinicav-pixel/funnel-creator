"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createFunnelSchema,
  funnelIdSchema,
  updateFunnelSettingsSchema,
} from "@/lib/validators/funnel";
import { requireWorkspace } from "@/server/context";
import {
  applyBrandToFunnel,
  createFunnel,
  deleteFunnel,
  duplicateFunnel,
  setFunnelStatus,
  updateFunnelSettings,
} from "@/server/services/funnel";
import { publishFunnel, unpublishFunnel } from "@/server/services/publish";

export async function createFunnelAction(formData: FormData) {
  const ctx = await requireWorkspace();
  const parsed = createFunnelSchema.safeParse({
    name: formData.get("name"),
    applyBrand: formData.get("applyBrand") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const funnel = await createFunnel(ctx, parsed.data);
  revalidatePath("/funnels");
  redirect(`/funnels/${funnel.id}/edit`);
}

export async function updateFunnelSettingsAction(formData: FormData) {
  const ctx = await requireWorkspace();
  const parsed = updateFunnelSettingsSchema.safeParse({
    funnelId: formData.get("funnelId"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    goal: formData.get("goal"),
    industry: formData.get("industry"),
    audience: formData.get("audience"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { funnelId, ...data } = parsed.data;
  const result = await updateFunnelSettings(ctx, funnelId, data);
  if ("error" in result) {
    return { error: result.error };
  }
  revalidatePath("/funnels");
  revalidatePath(`/funnels/${funnelId}/edit`);
  return { success: true };
}

export async function duplicateFunnelAction(formData: FormData) {
  const ctx = await requireWorkspace();
  const parsed = funnelIdSchema.safeParse({ funnelId: formData.get("funnelId") });
  if (!parsed.success) {
    return { error: "Solicitud inválida." };
  }

  const result = await duplicateFunnel(ctx, parsed.data.funnelId);
  if ("error" in result) {
    return { error: result.error };
  }
  revalidatePath("/funnels");
  return { success: true, funnelId: result.funnel.id };
}

export async function archiveFunnelAction(formData: FormData) {
  return changeStatus(formData, "ARCHIVED");
}

export async function restoreFunnelAction(formData: FormData) {
  return changeStatus(formData, "DRAFT");
}

async function changeStatus(formData: FormData, status: "DRAFT" | "ARCHIVED") {
  const ctx = await requireWorkspace();
  const parsed = funnelIdSchema.safeParse({ funnelId: formData.get("funnelId") });
  if (!parsed.success) {
    return { error: "Solicitud inválida." };
  }

  const result = await setFunnelStatus(ctx, parsed.data.funnelId, status);
  if ("error" in result) {
    return { error: result.error };
  }
  revalidatePath("/funnels");
  revalidatePath(`/funnels/${parsed.data.funnelId}/edit`);
  return { success: true };
}

export async function publishFunnelAction(formData: FormData) {
  const ctx = await requireWorkspace();
  const parsed = funnelIdSchema.safeParse({ funnelId: formData.get("funnelId") });
  if (!parsed.success) {
    return { error: "Solicitud inválida." };
  }

  const result = await publishFunnel(ctx, parsed.data.funnelId);
  if ("error" in result) {
    return { error: result.error };
  }
  revalidatePath("/funnels");
  revalidatePath(`/funnels/${parsed.data.funnelId}/edit`);
  return { success: true, versionNumber: result.version.versionNumber };
}

export async function unpublishFunnelAction(formData: FormData) {
  const ctx = await requireWorkspace();
  const parsed = funnelIdSchema.safeParse({ funnelId: formData.get("funnelId") });
  if (!parsed.success) {
    return { error: "Solicitud inválida." };
  }

  const result = await unpublishFunnel(ctx, parsed.data.funnelId);
  if ("error" in result) {
    return { error: result.error };
  }
  revalidatePath("/funnels");
  revalidatePath(`/funnels/${parsed.data.funnelId}/edit`);
  return { success: true };
}

export async function applyBrandToFunnelAction(formData: FormData) {
  const ctx = await requireWorkspace();
  const parsed = funnelIdSchema.safeParse({ funnelId: formData.get("funnelId") });
  if (!parsed.success) {
    return { error: "Solicitud inválida." };
  }

  const result = await applyBrandToFunnel(ctx, parsed.data.funnelId);
  if ("error" in result) {
    return { error: result.error };
  }
  revalidatePath(`/funnels/${parsed.data.funnelId}/edit`);
  return { success: true };
}

export async function deleteFunnelAction(formData: FormData) {
  const ctx = await requireWorkspace();
  const parsed = funnelIdSchema.safeParse({ funnelId: formData.get("funnelId") });
  if (!parsed.success) {
    return { error: "Solicitud inválida." };
  }

  const result = await deleteFunnel(ctx, parsed.data.funnelId);
  if ("error" in result) {
    return { error: result.error };
  }
  revalidatePath("/funnels");
  return { success: true };
}
