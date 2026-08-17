import Link from "next/link";
import { Sparkles } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/server/context";

export const metadata = { title: "Mis Funnels" };

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicado",
  ARCHIVED: "Archivado",
};

export default async function FunnelsPage() {
  const ctx = await requireWorkspace();
  const funnels = await prisma.funnel.findMany({
    where: { workspaceId: ctx.workspaceId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      updatedAt: true,
      _count: { select: { leads: true, sessions: true } },
    },
  });

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <PageHeader
        title="Mis Funnels"
        description="Crea, edita y publica tus funnels de conversión."
        actions={
          <Button asChild>
            <Link href="/create-ai">
              <Sparkles className="size-4" />
              Crear con IA
            </Link>
          </Button>
        }
      />

      {funnels.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="size-6 text-primary" />
              </span>
              <div>
                <p className="font-medium">Todavía no tienes funnels</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                  La gestión completa de funnels (crear, duplicar, archivar)
                  llega en la Fase 2. Empieza creando uno con IA.
                </p>
              </div>
              <Button asChild>
                <Link href="/create-ai">Crear mi primer funnel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <ul className="divide-y">
              {funnels.map((funnel) => (
                <li
                  key={funnel.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{funnel.name}</p>
                    <p className="text-xs text-muted-foreground">
                      /f/{funnel.slug} · {funnel._count.sessions} sesiones ·{" "}
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
