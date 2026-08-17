import "server-only";

import { prisma } from "@/lib/db";

/**
 * Crea el workspace inicial de un usuario recién registrado junto con su
 * membresía OWNER y los BrandSettings vacíos. Idempotente: si el usuario ya
 * tiene una membresía no crea nada.
 */
export async function createDefaultWorkspaceForUser(user: {
  id: string;
  name?: string | null;
  email: string;
}) {
  const existing = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  if (existing) {
    return prisma.workspace.findUniqueOrThrow({
      where: { id: existing.workspaceId },
    });
  }

  const displayName = user.name?.trim() || user.email.split("@")[0];

  return prisma.workspace.create({
    data: {
      name: `Workspace de ${displayName}`,
      createdBy: user.id,
      members: {
        create: { userId: user.id, role: "OWNER" },
      },
      brand: {
        create: {},
      },
    },
  });
}

export async function renameWorkspace(ctx: { workspaceId: string }, name: string) {
  return prisma.workspace.update({
    where: { id: ctx.workspaceId },
    data: { name },
  });
}
