import { PageHeader } from "@/components/layout/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatClp, formatLimit, PLAN_LIMITS, PLAN_ORDER } from "@/lib/plans";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/server/admin-context";
import { getWorkspacePlanUsage } from "@/server/services/plan";

import { updateWorkspacePlanAction } from "./actions";

export const metadata = { title: "Admin · Workspaces" };

export default async function AdminWorkspacesPage() {
  await requireAdmin();

  const workspaces = await prisma.workspace.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      createdAt: true,
      members: {
        where: { role: "OWNER" },
        take: 1,
        select: { user: { select: { email: true } } },
      },
    },
  });

  const rows = await Promise.all(
    workspaces.map(async (workspace) => ({
      workspace,
      usage: await getWorkspacePlanUsage(workspace.id),
    }))
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <PageHeader
        title="Workspaces"
        description="Activación manual de planes. Cambia el plan tras confirmar el pago (transferencia u otro medio) y deja una nota de referencia."
      />

      <div className="mt-6 rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Workspace</TableHead>
              <TableHead>Dueño</TableHead>
              <TableHead>Funnels publicados</TableHead>
              <TableHead>Respuestas este mes</TableHead>
              <TableHead>Plan activado</TableHead>
              <TableHead>Nota</TableHead>
              <TableHead>Cambiar plan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ workspace, usage }) => (
              <TableRow key={workspace.id}>
                <TableCell className="font-medium">{workspace.name}</TableCell>
                <TableCell>{workspace.members[0]?.user.email ?? "—"}</TableCell>
                <TableCell>
                  {usage.publishedFunnels} / {formatLimit(usage.limits.maxPublishedFunnels)}
                </TableCell>
                <TableCell>
                  {usage.responsesThisMonth} / {formatLimit(usage.limits.maxResponsesPerMonth)}
                </TableCell>
                <TableCell>
                  {usage.planActivatedAt
                    ? new Date(usage.planActivatedAt).toLocaleDateString("es-CL")
                    : "—"}
                </TableCell>
                <TableCell className="max-w-48 truncate" title={usage.planNote ?? ""}>
                  {usage.planNote ?? "—"}
                </TableCell>
                <TableCell>
                  <form
                    action={updateWorkspacePlanAction}
                    className="flex items-center gap-2"
                  >
                    <input type="hidden" name="workspaceId" value={workspace.id} />
                    <select
                      name="plan"
                      defaultValue={usage.plan}
                      className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      {PLAN_ORDER.map((plan) => (
                        <option key={plan} value={plan}>
                          {PLAN_LIMITS[plan].label}
                          {PLAN_LIMITS[plan].priceClp
                            ? ` — ${formatClp(PLAN_LIMITS[plan].priceClp)}`
                            : ""}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      name="note"
                      placeholder="Nota (ej. transferencia 18-08)"
                      defaultValue={usage.planNote ?? ""}
                      maxLength={500}
                      className="h-8 w-56 rounded-md border border-input bg-background px-2 text-sm"
                    />
                    <button
                      type="submit"
                      className="h-8 shrink-0 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
                    >
                      Guardar
                    </button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
