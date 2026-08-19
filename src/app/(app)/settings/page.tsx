import { PageHeader } from "@/components/layout/page-header";
import {
  ChangePasswordForm,
  ProfileForm,
} from "@/components/settings/profile-form";
import { WorkspaceForm } from "@/components/settings/workspace-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatClp, formatLimit } from "@/lib/plans";
import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/server/context";
import { getWorkspacePlanUsage } from "@/server/services/plan";

export const metadata = { title: "Configuración" };

export default async function SettingsPage() {
  const ctx = await requireWorkspace();
  const [workspace, usage] = await Promise.all([
    prisma.workspace.findUniqueOrThrow({
      where: { id: ctx.workspaceId },
      select: { name: true },
    }),
    getWorkspacePlanUsage(ctx.workspaceId),
  ]);

  const canEditWorkspace = ctx.role === "OWNER" || ctx.role === "ADMIN";

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <PageHeader
        title="Configuración"
        description="Tu perfil, tu contraseña y tu workspace."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Perfil</CardTitle>
          <CardDescription>{ctx.user.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm initialName={ctx.user.name} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contraseña</CardTitle>
          <CardDescription>
            Cambiarla cerrará tus sesiones en otros dispositivos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plan</CardTitle>
          <CardDescription>
            {usage.limits.priceClp
              ? `${usage.limits.label} — ${formatClp(usage.limits.priceClp)}/mes`
              : `${usage.limits.label} — sin costo`}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-1.5 text-sm text-muted-foreground">
          <p>
            Funnels publicados: {usage.publishedFunnels} de{" "}
            {formatLimit(usage.limits.maxPublishedFunnels)}
          </p>
          <p>
            Respuestas este mes: {usage.responsesThisMonth} de{" "}
            {formatLimit(usage.limits.maxResponsesPerMonth)}
          </p>
          <p>
            ¿Quieres subir de plan? Escríbenos y activamos el cambio apenas
            confirmemos el pago.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workspace</CardTitle>
          <CardDescription>
            Toda tu información comercial pertenece a este workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkspaceForm
            initialName={workspace.name}
            canEdit={canEditWorkspace}
          />
        </CardContent>
      </Card>
    </div>
  );
}
