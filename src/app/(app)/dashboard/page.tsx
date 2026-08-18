import { Suspense } from "react";
import Link from "next/link";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { PerformanceCard } from "@/components/dashboard/performance-card";
import { FunnelStatusBadge } from "@/components/funnels/status-badge";
import { FunnelThumb } from "@/components/funnels/funnel-thumb";
import { Button } from "@/components/ui/button";
import { requireWorkspace } from "@/server/context";
import {
  getDashboardMetrics,
  getDashboardSeries,
  getRecentFunnels,
} from "@/server/services/dashboard";

export const metadata = { title: "Dashboard" };

const RANGE_VALUES = [7, 30, 90];

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const ctx = await requireWorkspace();
  const params = await searchParams;
  const requested = Number(params.dias);
  const days = RANGE_VALUES.includes(requested) ? requested : 30;

  const [metrics, series, recentFunnels] = await Promise.all([
    getDashboardMetrics(ctx, days),
    getDashboardSeries(ctx, days),
    getRecentFunnels(ctx),
  ]);

  const periodLabel = `vs. ${days} días anteriores`;
  const dateFormatter = new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "short",
  });

  return (
    <div className="mx-auto grid max-w-[1180px] gap-[22px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="display text-[34px] text-ink">
            hola, {ctx.user.name.split(" ")[0].toLowerCase()}
          </h1>
          <p className="mt-1 text-[15px] text-ink-primary">
            Este es el rendimiento de tus funnels en los últimos {days} días.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/create-ai">+ Crear funnel</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Funnels activos"
          value={String(metrics.activeFunnels.value)}
          periodLabel={`${metrics.totalFunnels} en total`}
        />
        <KpiCard
          label="Visitas"
          value={metrics.views.value.toLocaleString("es")}
          delta={metrics.views.delta}
          periodLabel={periodLabel}
        />
        <KpiCard
          label="Leads"
          value={metrics.leads.value.toLocaleString("es")}
          delta={metrics.leads.delta}
          periodLabel={periodLabel}
        />
        <KpiCard
          label="Conversión"
          value={`${metrics.conversionRate.value.toLocaleString("es")}%`}
          delta={metrics.conversionRate.delta}
          deltaSuffix=" pts"
          periodLabel={periodLabel}
        />
      </div>

      <Suspense fallback={<div className="h-[340px] rounded-2xl bg-surface" />}>
        <PerformanceCard series={series} range={days} />
      </Suspense>

      <section className="overflow-hidden rounded-2xl border border-line bg-card">
        <div className="flex items-center justify-between gap-3 px-6 py-4">
          <h2 className="display text-[20px] text-ink">Funnels recientes</h2>
          {recentFunnels.length > 0 ? (
            <Link
              href="/funnels"
              className="text-[13.5px] font-medium text-brand underline-offset-4 hover:underline"
            >
              Ver todos
            </Link>
          ) : null}
        </div>

        {recentFunnels.length === 0 ? (
          <div className="border-t border-line px-6 py-14 text-center">
            <p className="display text-[18px] text-ink">
              Todavía no tienes funnels
            </p>
            <p className="mx-auto mt-1.5 max-w-sm text-[14.5px] text-ink-primary">
              Describe tu negocio y tu objetivo, y la IA creará tu primer funnel
              listo para publicar.
            </p>
            <Button asChild className="mt-5">
              <Link href="/create-ai">Crear mi primer funnel</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="bg-[#F7F6F3] text-left">
                  {["Funnel", "Estado", "Visitas", "Leads", "Conversión", "Modificado"].map(
                    (headerLabel, i) => (
                      <th
                        key={headerLabel}
                        className={`px-4 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.045em] text-ink-secondary ${
                          i === 0 ? "pl-6" : ""
                        } ${i > 1 ? "text-right" : ""} ${i === 5 ? "pr-6" : ""}`}
                      >
                        {headerLabel}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {recentFunnels.map((funnel) => (
                  <tr
                    key={funnel.id}
                    className="border-t border-[#F1F0ED] transition-colors hover:bg-[#F7F6F3]"
                  >
                    <td className="py-3 pl-6 pr-4">
                      <Link
                        href={`/funnels/${funnel.id}/edit`}
                        className="flex items-center gap-3"
                      >
                        <FunnelThumb
                          status={funnel.status}
                          height={34}
                          compact
                          className="w-[34px] shrink-0 rounded-[10px] p-1.5"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-[14.5px] font-medium text-ink">
                            {funnel.name}
                          </span>
                          <span className="block truncate text-[12.5px] text-ink-secondary">
                            {funnel.industry ?? `/f/${funnel.slug}`}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <FunnelStatusBadge status={funnel.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-[14px] tabular-nums text-ink">
                      {funnel.views.toLocaleString("es")}
                    </td>
                    <td className="px-4 py-3 text-right text-[14px] tabular-nums text-ink">
                      {funnel._count.leads.toLocaleString("es")}
                    </td>
                    <td className="px-4 py-3 text-right text-[14px] tabular-nums text-ink">
                      {funnel.conversionRate.toLocaleString("es")}%
                    </td>
                    <td className="py-3 pl-4 pr-6 text-right text-[13px] text-ink-secondary">
                      {dateFormatter.format(funnel.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
