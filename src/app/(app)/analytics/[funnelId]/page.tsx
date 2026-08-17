import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Users } from "lucide-react";

import { FunnelStatusBadge } from "@/components/funnels/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireWorkspace } from "@/server/context";
import { getFunnelAnalytics } from "@/server/services/analytics";

export const metadata = { title: "Analytics del funnel" };

export default async function FunnelAnalyticsPage({
  params,
}: PageProps<"/analytics/[funnelId]">) {
  const ctx = await requireWorkspace();
  const { funnelId } = await params;
  const analytics = await getFunnelAnalytics(ctx, funnelId);
  if (!analytics) {
    notFound();
  }
  const { funnel, steps, rates, dropoff, dropoffSessions, resultsViewed } =
    analytics;

  const funnelSteps = [
    { label: "Visitas", value: steps.views },
    { label: "Inicios", value: steps.starts },
    { label: "Completados", value: steps.completions },
    { label: "Leads", value: steps.leads },
    { label: "Clics en CTA", value: steps.ctaClicks },
  ];
  const maxStep = Math.max(1, ...funnelSteps.map((s) => s.value));

  const rateCards = [
    {
      label: "Tasa de conversión",
      value: rates.conversionRate,
      hint: "leads / visitas",
    },
    {
      label: "Tasa de finalización",
      value: rates.completionRate,
      hint: "completados / inicios",
    },
    {
      label: "Tasa de captura",
      value: rates.leadCaptureRate,
      hint: "leads / completados",
    },
    {
      label: "Tasa de clic en CTA",
      value: rates.ctaClickRate,
      hint: `clics / ${resultsViewed} resultados vistos`,
    },
  ];

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/analytics">
              <ArrowLeft className="size-4" />
              <span className="sr-only">Volver a Analytics</span>
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">
                {funnel.name}
              </h1>
              <FunnelStatusBadge status={funnel.status} />
            </div>
            <p className="text-xs text-muted-foreground">/f/{funnel.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/leads?funnel=${funnel.id}`}>
              <Users className="size-4" />
              Ver leads
            </Link>
          </Button>
          {funnel.status === "PUBLISHED" ? (
            <Button asChild variant="outline" size="sm">
              <a
                href={`/f/${funnel.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-4" />
                Ver funnel
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Embudo de conversión</CardTitle>
          <CardDescription>
            Visitas → Inicios → Completados → Leads → CTA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2.5">
            {funnelSteps.map((step) => (
              <div key={step.label} className="grid gap-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{step.label}</span>
                  <span className="font-semibold tabular-nums">
                    {step.value}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${Math.round((step.value / maxStep) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {rateCards.map((rate) => (
          <Card key={rate.label} className="gap-2 py-4">
            <CardHeader className="px-4">
              <CardDescription className="text-xs">
                {rate.label}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4">
              <p className="text-2xl font-semibold tabular-nums">
                {rate.value}%
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {rate.hint}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Abandono por pregunta</CardTitle>
          <CardDescription>
            Porcentaje de sesiones que llegó a responder cada pregunta
            {dropoffSessions > 0
              ? ` (sobre ${dropoffSessions} sesiones conservadas)`
              : ""}
            . Una caída brusca señala una pregunta problemática.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dropoff.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Este funnel no tiene preguntas.
            </p>
          ) : dropoffSessions === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Todavía no hay sesiones registradas.
            </p>
          ) : (
            <ol className="grid gap-2.5">
              {dropoff.map((q, index) => (
                <li key={q.questionId} className="grid gap-1">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">
                      <span className="text-muted-foreground">
                        Pregunta {index + 1}:
                      </span>{" "}
                      {q.title}
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums">
                      {q.reachRate}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/70"
                      style={{ width: `${Math.min(100, q.reachRate)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
