import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  Eye,
  Filter,
  Play,
  Plus,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireWorkspace } from "@/server/context";
import {
  getDashboardMetrics,
  getRecentFunnels,
} from "@/server/services/dashboard";

export const metadata = { title: "Dashboard" };

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicado",
  ARCHIVED: "Archivado",
};

export default async function DashboardPage() {
  const ctx = await requireWorkspace();
  const [metrics, recentFunnels] = await Promise.all([
    getDashboardMetrics(ctx),
    getRecentFunnels(ctx),
  ]);

  const cards = [
    { label: "Funnels activos", value: metrics.activeFunnels, icon: Filter },
    { label: "Visitas", value: metrics.views, icon: Eye },
    { label: "Funnels iniciados", value: metrics.starts, icon: Play },
    { label: "Funnels completados", value: metrics.completions, icon: CheckCircle2 },
    { label: "Leads", value: metrics.leads, icon: Users },
    { label: "Conversiones", value: metrics.conversions, icon: Target },
    {
      label: "Tasa de conversión",
      value: `${metrics.conversionRate}%`,
      icon: BarChart3,
    },
  ];

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Hola, {ctx.user.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground">
            Así va tu captación de leads hoy.
          </p>
        </div>
        <Button asChild>
          <Link href="/create-ai">
            <Plus className="size-4" />
            Crear Funnel
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label} className="gap-2 py-4">
            <CardHeader className="flex-row items-center justify-between px-4">
              <CardDescription className="text-xs">
                {card.label}
              </CardDescription>
              <card.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4">
              <p className="text-2xl font-semibold tabular-nums">
                {card.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Mis Funnels</CardTitle>
            <CardDescription>
              Tus funnels más recientes y su rendimiento
            </CardDescription>
          </div>
          {recentFunnels.length > 0 ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/funnels">Ver todos</Link>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {recentFunnels.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="size-6 text-primary" />
              </span>
              <div>
                <p className="font-medium">Todavía no tienes funnels</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                  Describe tu negocio y tu objetivo, y la IA creará tu primer
                  funnel listo para publicar.
                </p>
              </div>
              <Button asChild>
                <Link href="/create-ai">
                  <Sparkles className="size-4" />
                  Crear mi primer funnel
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y">
              {recentFunnels.map((funnel) => (
                <li
                  key={funnel.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{funnel.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {funnel._count.sessions} sesiones ·{" "}
                      {funnel._count.leads} leads
                    </p>
                  </div>
                  <Badge
                    variant={
                      funnel.status === "PUBLISHED" ? "default" : "secondary"
                    }
                  >
                    {STATUS_LABEL[funnel.status] ?? funnel.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
