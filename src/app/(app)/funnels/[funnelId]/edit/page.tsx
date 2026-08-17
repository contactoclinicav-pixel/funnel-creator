import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Globe } from "lucide-react";

import { BuilderTabs } from "@/components/builder/builder-tabs";
import { PreviewPane } from "@/components/builder/preview-pane";
import { FunnelRowActions } from "@/components/funnels/funnel-row-actions";
import { PublishControls } from "@/components/funnels/publish-controls";
import { FunnelStatusBadge } from "@/components/funnels/status-badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/server/context";
import { compileFunnelSnapshot } from "@/server/services/snapshot";

export const metadata = { title: "Editar funnel" };

export default async function FunnelEditPage({
  params,
}: PageProps<"/funnels/[funnelId]/edit">) {
  const ctx = await requireWorkspace();
  const { funnelId } = await params;

  const [funnel, snapshot] = await Promise.all([
    prisma.funnel.findFirst({
      where: { id: funnelId, workspaceId: ctx.workspaceId },
      include: {
        _count: { select: { leads: true, sessions: true } },
      },
    }),
    compileFunnelSnapshot(ctx, funnelId),
  ]);
  if (!funnel || !snapshot) {
    notFound();
  }

  return (
    <div className="mx-auto grid max-w-[1400px] gap-5">
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
          <PublishControls
            funnel={{
              id: funnel.id,
              slug: funnel.slug,
              status: funnel.status,
              questionCount: snapshot.questions.length,
            }}
          />
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

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,440px)]">
        <BuilderTabs
          snapshot={snapshot}
          settings={{
            id: funnel.id,
            name: funnel.name,
            slug: funnel.slug,
            goal: funnel.goal,
            industry: funnel.industry,
            audience: funnel.audience,
          }}
        />
        <div className="sticky top-20 hidden h-[calc(100vh-7rem)] xl:block">
          <PreviewPane snapshot={snapshot} />
        </div>
      </div>
    </div>
  );
}
