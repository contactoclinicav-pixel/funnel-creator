import Link from "next/link";
import { Users } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { LeadStatusBadge } from "@/components/leads/lead-status";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { requireWorkspace } from "@/server/context";
import { listLeads } from "@/server/services/lead";
import { prisma } from "@/lib/db";
import type { LeadStatus } from "@/generated/prisma/enums";

export const metadata = { title: "Leads" };

const STATUS_FILTERS: { key: string; label: string; status?: LeadStatus }[] = [
  { key: "todos", label: "Todos" },
  { key: "nuevos", label: "Nuevos", status: "NEW" },
  { key: "contactados", label: "Contactados", status: "CONTACTED" },
  { key: "calificados", label: "Calificados", status: "QUALIFIED" },
  { key: "convertidos", label: "Convertidos", status: "CONVERTED" },
  { key: "perdidos", label: "Perdidos", status: "LOST" },
];

export default async function LeadsPage({ searchParams }: PageProps<"/leads">) {
  const ctx = await requireWorkspace();
  const params = await searchParams;
  const filterKey = typeof params.estado === "string" ? params.estado : "todos";
  const filter = STATUS_FILTERS.find((f) => f.key === filterKey) ?? STATUS_FILTERS[0];
  const funnelId = typeof params.funnel === "string" ? params.funnel : undefined;

  const [leads, funnelFilter] = await Promise.all([
    listLeads(ctx, { status: filter.status, funnelId }),
    funnelId
      ? prisma.funnel.findFirst({
          where: { id: funnelId, workspaceId: ctx.workspaceId },
          select: { name: true },
        })
      : Promise.resolve(null),
  ]);

  const dateFormatter = new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  function filterHref(key: string) {
    const params = new URLSearchParams();
    if (key !== "todos") params.set("estado", key);
    if (funnelId) params.set("funnel", funnelId);
    const qs = params.toString();
    return qs ? `/leads?${qs}` : "/leads";
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <PageHeader
        title="Leads"
        description={
          funnelFilter
            ? `Leads del funnel «${funnelFilter.name}».`
            : "Contactos captados por tus funnels."
        }
      />

      <div className="flex flex-wrap items-center gap-1">
        {STATUS_FILTERS.map((f) => (
          <Link
            key={f.key}
            href={filterHref(f.key)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              f.key === filter.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {f.label}
          </Link>
        ))}
        {funnelFilter ? (
          <Link
            href="/leads"
            className="ml-2 text-xs text-muted-foreground underline underline-offset-4"
          >
            Quitar filtro de funnel
          </Link>
        ) : null}
      </div>

      {leads.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <Users className="size-6 text-primary" />
              </span>
              <div>
                <p className="font-medium">
                  {filter.status
                    ? `No hay leads en «${filter.label}»`
                    : "Todavía no tienes leads"}
                </p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                  Publica un funnel y comparte su enlace para empezar a captar
                  contactos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="py-0">
          <CardContent className="overflow-x-auto px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Nombre</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Funnel</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="pr-6">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="pl-6">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="font-medium hover:underline"
                      >
                        {lead.name || "Sin nombre"}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <p>{lead.email || "—"}</p>
                      {lead.phone ? <p>{lead.phone}</p> : null}
                    </TableCell>
                    <TableCell className="max-w-44 truncate text-sm">
                      {lead.funnel.name}
                    </TableCell>
                    <TableCell className="max-w-40 truncate text-sm">
                      {lead.resultTitle ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {dateFormatter.format(lead.createdAt)}
                    </TableCell>
                    <TableCell className="pr-6">
                      <LeadStatusBadge status={lead.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {leads.length === 200 ? (
        <p className="text-center text-xs text-muted-foreground">
          Mostrando los 200 leads más recientes.
        </p>
      ) : null}
    </div>
  );
}
