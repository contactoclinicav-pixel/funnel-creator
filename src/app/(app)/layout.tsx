import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/server/context";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireWorkspace();
  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: ctx.workspaceId },
    select: { name: true },
  });

  return (
    <AppShell
      user={{ name: ctx.user.name, email: ctx.user.email }}
      workspaceName={workspace.name}
    >
      {children}
    </AppShell>
  );
}
