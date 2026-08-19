import "server-only";

import { prisma } from "@/lib/db";
import { canPublishAnotherFunnel } from "@/server/services/plan";
import { compileFunnelSnapshot } from "@/server/services/snapshot";

interface Ctx {
  userId: string;
  workspaceId: string;
}

/**
 * Publica el borrador actual: compila un snapshot inmutable, crea una nueva
 * FunnelVersion y marca el funnel como PUBLISHED. El runner público solo lee
 * la última versión publicada, así que editar el draft nunca afecta al
 * funnel en vivo hasta volver a publicar.
 */
export async function publishFunnel(ctx: Ctx, funnelId: string) {
  const funnel = await prisma.funnel.findFirst({
    where: { id: funnelId, workspaceId: ctx.workspaceId },
    select: { id: true, status: true, _count: { select: { questions: true } } },
  });
  if (!funnel) return { error: "Funnel no encontrado." as const };
  if (funnel.status === "ARCHIVED") {
    return { error: "Restaura el funnel antes de publicarlo." as const };
  }
  if (funnel._count.questions === 0) {
    return {
      error: "Añade al menos una pregunta antes de publicar." as const,
    };
  }
  if (funnel.status !== "PUBLISHED") {
    const canPublish = await canPublishAnotherFunnel(ctx.workspaceId, funnelId);
    if (!canPublish) {
      return {
        error:
          "Alcanzaste el límite de funnels publicados de tu plan. Actualiza tu plan para publicar más.",
      };
    }
  }

  const snapshot = await compileFunnelSnapshot(ctx, funnelId);
  if (!snapshot) return { error: "Funnel no encontrado." as const };

  const version = await prisma.$transaction(async (tx) => {
    const last = await tx.funnelVersion.aggregate({
      where: { funnelId },
      _max: { versionNumber: true },
    });
    const created = await tx.funnelVersion.create({
      data: {
        funnelId,
        versionNumber: (last._max.versionNumber ?? 0) + 1,
        snapshot,
        createdBy: ctx.userId,
      },
    });
    await tx.funnel.update({
      where: { id: funnelId },
      data: { status: "PUBLISHED" },
    });
    return created;
  });

  return { version };
}

/** Despublica: el funnel vuelve a borrador y la URL pública deja de servir. */
export async function unpublishFunnel(ctx: Ctx, funnelId: string) {
  const funnel = await prisma.funnel.findFirst({
    where: { id: funnelId, workspaceId: ctx.workspaceId },
    select: { id: true, status: true },
  });
  if (!funnel) return { error: "Funnel no encontrado." as const };
  if (funnel.status !== "PUBLISHED") {
    return { error: "El funnel no está publicado." as const };
  }
  await prisma.funnel.update({
    where: { id: funnelId },
    data: { status: "DRAFT" },
  });
  return { success: true as const };
}
