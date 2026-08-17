import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Globe, Hourglass } from "lucide-react";

import { FunnelRowActions } from "@/components/funnels/funnel-row-actions";
import { FunnelSettingsForm } from "@/components/funnels/funnel-settings-form";
import { FunnelStatusBadge } from "@/components/funnels/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/server/context";

export const metadata = { title: "Editar funnel" };

const BUILDER_TABS = [
  "Diseño",
  "Preguntas",
  "Lógica",
  "Resultados",
  "Lead Capture",
  "CTA",
];

export default async function FunnelEditPage({
  params,
}: PageProps<"/funnels/[funnelId]/edit">) {
  const ctx = await requireWorkspace();
  const { funnelId } = await params;

  const funnel = await prisma.funnel.findFirst({
    where: { id: funnelId, workspaceId: ctx.workspaceId },
    include: {
      _count: { select: { leads: true, sessions: true, questions: true } },
    },
  });
  if (!funnel) {
    notFound();
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/funnels">
              <ArrowLeft className="size-4" />
              <span className="sr-only">Volver a Mis Funnels</span>
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">
                {funnel.name}
              </h1>
              <FunnelStatusBadge status={funnel.status} />
            </div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Globe className="size-3" />
              /f/{funnel.slug}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button disabled title="Disponible cuando el builder y el runner estén listos (Fases 3-4)">
            Publicar
          </Button>
          <FunnelRowActions
            funnel={{
              id: funnel.id,
              name: funnel.name,
              status: funnel.status,
              leadCount: funnel._count.leads,
              sessionCount: funnel._count.sessions,
            }}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ajustes generales</CardTitle>
          <CardDescription>
            Nombre, URL pública y contexto del funnel. Este contexto también
            alimentará a la IA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FunnelSettingsForm
            funnel={{
              id: funnel.id,
              name: funnel.name,
              slug: funnel.slug,
              goal: funnel.goal,
              industry: funnel.industry,
              audience: funnel.audience,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Builder</CardTitle>
          <CardDescription>
            El editor visual de preguntas, lógica, resultados, captura de leads
            y CTA llega en la Fase 3.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {BUILDER_TABS.map((tab) => (
              <span
                key={tab}
                className="inline-flex items-center gap-1.5 rounded-md border border-dashed px-3 py-1.5 text-sm text-muted-foreground"
              >
                <Hourglass className="size-3.5" />
                {tab}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
