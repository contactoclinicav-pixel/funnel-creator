import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createDefaultWorkspaceForUser } from "@/server/services/workspace";
import type { MemberRole } from "@/generated/prisma/enums";

export interface TenantContext {
  userId: string;
  workspaceId: string;
  role: MemberRole;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

/** Devuelve la sesión o redirige a /login. Solo para Server Components/Actions. */
export async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }
  return session;
}

/**
 * Resuelve el contexto de tenant {userId, workspaceId} desde la sesión.
 * TODA la lógica de negocio debe recibir este contexto; nunca aceptar un
 * workspaceId proveniente del cliente.
 */
export async function requireWorkspace(): Promise<TenantContext> {
  const session = await requireSession();

  let membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) {
    // Autocuración: usuarios creados antes del hook (o hook fallido).
    const workspace = await createDefaultWorkspaceForUser(session.user);
    membership = await prisma.workspaceMember.findFirstOrThrow({
      where: { userId: session.user.id, workspaceId: workspace.id },
    });
  }

  return {
    userId: session.user.id,
    workspaceId: membership.workspaceId,
    role: membership.role,
    user: session.user,
  };
}
