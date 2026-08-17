import Link from "next/link";
import { BarChart3 } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { FunnelStatusBadge } from "@/components/funnels/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireWorkspace } from "@/server/context";
import { getFunnelOverviews } from "@/server/services/analytics";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const ctx = await requireWorkspace();
  const funnels = await getFunnelOverviews(ctx);
  const withData = funnels.filter((f) => f.views > 0 || f.starts > 0);
  const withoutData = funnels.filter((f) => f.views === 0 && f.starts === 0);

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <PageHeader
        title="Analytics"
        description="Rendimiento de tus funnels: visitas, conversión y abandono."
      />

      {funnels.length === 0 ? (
        <EmptyState message="Crea y publica un funnel para empezar a medir." />
      ) : withData.length === 0 ? (
        <EmptyState message="Aún no hay visitas registradas. Comparte la URL pública de un funnel publicado." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {withData.map((funnel) => (
            <Link key={funnel.id} href={`/analytics/${funnel.id}`}>
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardContent className="grid gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium leading-snug">{funnel.name}</p>
                    <FunnelStatusBadge status={funnel.status} />
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <Stat label="Visitas" value={funnel.views} />
                    <Stat label="Inicios" value={funnel.starts} />
                    <Stat label="Leads" value={funnel.leads} />
                    <Stat label="Conv." value={`${funnel.conversionRate}%`} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {withoutData.length > 0 && withData.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          Sin datos todavía:{" "}
          {withoutData.map((f) => f.name).join(", ")}.
        </p>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent>
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <BarChart3 className="size-6 text-primary" />
          </span>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            {message}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
