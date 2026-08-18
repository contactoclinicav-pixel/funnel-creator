import "server-only";

import { prisma } from "@/lib/db";
import { funnelGenerationSchema } from "@/server/ai/generation-schema";
import { materializeFunnelFromSpec } from "@/server/services/funnel-materializer";
import { TEMPLATE_LIBRARY } from "@/server/templates/library";

interface Ctx {
  userId: string;
  workspaceId: string;
}

/**
 * Crea (o actualiza) en DB las plantillas de `TEMPLATE_LIBRARY`. Es
 * idempotente y barata (5 filas), así que se llama de forma perezosa desde
 * la página de Templates en vez de requerir un paso de seed separado.
 */
export async function ensureTemplatesSeeded() {
  for (const tpl of TEMPLATE_LIBRARY) {
    const existing = await prisma.template.findFirst({
      where: { name: tpl.name },
      select: { id: true },
    });
    if (existing) {
      await prisma.template.update({
        where: { id: existing.id },
        data: {
          description: tpl.description,
          category: tpl.category,
          config: tpl.config,
          isActive: true,
        },
      });
    } else {
      await prisma.template.create({
        data: {
          name: tpl.name,
          description: tpl.description,
          category: tpl.category,
          config: tpl.config,
        },
      });
    }
  }
}

export async function listTemplates() {
  await ensureTemplatesSeeded();
  return prisma.template.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, description: true, category: true },
  });
}

export async function createFunnelFromTemplate(ctx: Ctx, templateId: string) {
  const template = await prisma.template.findUnique({
    where: { id: templateId },
  });
  if (!template || !template.isActive) {
    return { error: "Plantilla no encontrada." as const };
  }

  const parsed = funnelGenerationSchema.safeParse(template.config);
  if (!parsed.success) {
    console.error("[templates] Config inválida:", template.id, parsed.error);
    return { error: "Esta plantilla tiene un formato inválido." as const };
  }

  const funnelId = await materializeFunnelFromSpec(ctx, parsed.data);
  return { funnelId };
}
