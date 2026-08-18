import Link from "next/link";

import { PageHeader, UnderlineTabs } from "@/components/layout/page-header";
import { CreateFunnelDialog } from "@/components/funnels/create-funnel-dialog";
import { FunnelRowActions } from "@/components/funnels/funnel-row-actions";
import { FunnelThumb } from "@/components/funnels/funnel-thumb";
import { Button } from "@/components/ui/button";
import { requireWorkspace } from "@/server/context";
import { listFunnels } from "@/server/services/funnel";
import type { FunnelStatus } from "@/generated/prisma/enums";

export const metadata = { title: "Mis Funnels" };

const FILTERS: { key: string; label: string; status?: FunnelStatus }[] = [
  { key: "todos", label: "Todos" },
  { key: "activos", label: "Activos", status: "PUBLISHED" },
  { key: "borradores", label: "Borradores", status: "DRAFT" },
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

  const [funnels, allFunnels] = await Promise.all([
    listFunnels(ctx, { status: filter.status }),
    listFunnels(ctx),
  ]);

  const publishedCount = allFunnels.filter(
    (f) => f.status === "PUBLISHED"
  ).length;
  const dateFormatter = new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="mx-auto grid max-w-[1180px] gap-6">
      <PageHeader
        title="Mis Funnels"
        description={
          allFunnels.length > 0
            ? `${allFunnels.length} funnels · ${publishedCount} publicados`
            : "Crea, edita y publica tus funnels de conversión."
        }
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/create-ai">Crear con IA</Link>
            </Button>
            <CreateFunnelDialog key={String(openNew)} defaultOpen={openNew} />
          </div>
        }
      />

      <UnderlineTabs
        activeKey={filter.key}
        items={FILTERS.map((f) => ({
          key: f.key,
          label: f.label,
          href: f.key === "todos" ? "/funnels" : `/funnels?estado=${f.key}`,
        }))}
      />

      {funnels.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-soft bg-card px-6 py-16 text-center">
          <p className="display text-[18px] text-ink">
            {filter.status
              ? `No tienes funnels en «${filter.label}»`
              : "Todavía no tienes funnels"}
          </p>
          <p className="mx-auto mt-1.5 max-w-sm text-[14.5px] text-ink-primary">
            Describe tu negocio y deja que la IA cree el primero, o empieza uno
            en blanco.
          </p>
          <Button asChild className="mt-5">
            <Link href="/create-ai">Crear con IA</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
          {funnels.map((funnel) => (
            <article
              key={funnel.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-card transition-colors transition-brand hover:border-brand"
            >
              <Link href={`/funnels/${funnel.id}/edit`} className="block p-3 pb-0">
                <FunnelThumb status={funnel.status} height={150} />
              </Link>

              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/funnels/${funnel.id}/edit`}
                    className="min-w-0 flex-1"
                  >
                    <h3 className="truncate text-[15.5px] font-semibold text-ink">
                      {funnel.name}
                    </h3>
                    <p className="mt-0.5 truncate text-[12.5px] text-ink-secondary">
                      {funnel.goal ?? `/f/${funnel.slug}`}
                    </p>
                  </Link>
                  <FunnelRowActions
                    funnel={{
                      id: funnel.id,
                      name: funnel.name,
                      status: funnel.status,
                      leadCount: funnel._count.leads,
                      sessionCount: funnel._count.sessions,
                      slug: funnel.slug,
                    }}
                  />
                </div>

                <p className="mt-1 text-[12.5px] text-ink-placeholder">
                  Modificado {dateFormatter.format(funnel.updatedAt)}
                </p>

                <div className="mt-4 flex items-center gap-3 border-t border-[#F1F0ED] pt-3 text-[12.5px] text-ink-secondary">
                  <span>
                    <span className="font-semibold text-ink tabular-nums">
                      {funnel._count.questions}
                    </span>{" "}
                    {funnel._count.questions === 1 ? "pregunta" : "preguntas"}
                  </span>
                  <span>·</span>
                  <span>
                    <span className="font-semibold text-ink tabular-nums">
                      {funnel._count.sessions}
                    </span>{" "}
                    {funnel._count.sessions === 1 ? "sesión" : "sesiones"}
                  </span>
                  <span>·</span>
                  <span>
                    <span className="font-semibold text-ink tabular-nums">
                      {funnel._count.leads}
                    </span>{" "}
                    {funnel._count.leads === 1 ? "lead" : "leads"}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
