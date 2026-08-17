import Link from "next/link";
import { Sparkles } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { CreateFunnelDialog } from "@/components/funnels/create-funnel-dialog";
import { FunnelRowActions } from "@/components/funnels/funnel-row-actions";
import { FunnelStatusBadge } from "@/components/funnels/status-badge";
import { Button } from "@/components/ui/button";
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
import { listFunnels } from "@/server/services/funnel";
import type { FunnelStatus } from "@/generated/prisma/enums";

export const metadata = { title: "Mis Funnels" };

const FILTERS: { key: string; label: string; status?: FunnelStatus }[] = [
  { key: "todos", label: "Todos" },
  { key: "borradores", label: "Borradores", status: "DRAFT" },
  { key: "publicados", label: "Publicados", status: "PUBLISHED" },
  { key: "archivados", label: "Archivados", status: "ARCHIVED" },
];

export default async function FunnelsPage({
  searchParams,
}: PageProps<"/funnels">) {
  const ctx = await requireWorkspace();
  const params = await searchParams;
  const filterKey = typeof params.estado === "string" ? params.estado : "todos";
  const filter = FILTERS.find((f) => f.key === filterKey) ?? FILTERS[0];
  const openNew = params.nuevo === "1";

  const funnels = await listFunnels(ctx, { status: filter.status });

  const dateFormatter = new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <PageHeader
        title="Mis Funnels"
        description="Crea, edita y publica tus funnels de conversión."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/create-ai">
                <Sparkles className="size-4" />
                Crear con IA
              </Link>
            </Button>
            <CreateFunnelDialog key={String(openNew)} defaultOpen={openNew} />
          </div>
        }
      />

      <div className="flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "todos" ? "/funnels" : `/funnels?estado=${f.key}`}
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
      </div>

      {funnels.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="size-6 text-primary" />
              </span>
              <div>
                <p className="font-medium">
                  {filter.status
                    ? `No tienes funnels en «${filter.label}»`
                    : "Todavía no tienes funnels"}
                </p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                  Crea uno en blanco o espera a la creación con IA (Fase 7)
                  para generarlo describiendo tu negocio.
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
                  <TableHead className="pl-6">Funnel</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Preguntas</TableHead>
                  <TableHead className="text-right">Sesiones</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead>Actualizado</TableHead>
                  <TableHead className="w-12 pr-4" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {funnels.map((funnel) => (
                  <TableRow key={funnel.id}>
                    <TableCell className="pl-6">
                      <Link
                        href={`/funnels/${funnel.id}/edit`}
                        className="font-medium hover:underline"
                      >
                        {funnel.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        /f/{funnel.slug}
                      </p>
                    </TableCell>
                    <TableCell>
                      <FunnelStatusBadge status={funnel.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {funnel._count.questions}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {funnel._count.sessions}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {funnel._count.leads}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {dateFormatter.format(funnel.updatedAt)}
                    </TableCell>
                    <TableCell className="pr-4">
                      <FunnelRowActions
                        funnel={{
                          id: funnel.id,
                          name: funnel.name,
                          status: funnel.status,
                          leadCount: funnel._count.leads,
                          sessionCount: funnel._count.sessions,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
