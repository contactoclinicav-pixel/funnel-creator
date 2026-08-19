import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { QuotaReachedScreen } from "@/components/runner/quota-reached";
import { PublicRunner } from "@/components/runner/public-runner";
import {
  getPublishedFunnelBySlug,
  logEvent,
} from "@/server/services/public-runner";
import { hasReachedResponseQuota } from "@/server/services/plan";

// La página pública siempre sirve la última versión publicada.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/f/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const published = await getPublishedFunnelBySlug(slug);
  if (!published) return { title: { absolute: "Funnel no disponible" } };
  // El funnel público es white-label: no arrastra la marca aifunnel al título.
  return {
    title: { absolute: published.snapshot.intro.headline },
    description: published.snapshot.intro.subheadline || undefined,
    robots: { index: true },
  };
}

export default async function PublicFunnelPage({
  params,
}: PageProps<"/f/[slug]">) {
  const { slug } = await params;
  const published = await getPublishedFunnelBySlug(slug);
  if (!published) {
    notFound();
  }

  // funnel_view server-side; nunca debe tumbar la página si falla.
  logEvent({
    workspaceId: published.workspaceId,
    funnelId: published.funnelId,
    type: "FUNNEL_VIEW",
  }).catch(() => undefined);

  // El plan del workspace limita cuántas respuestas puede recibir por mes;
  // al alcanzarlo, no se acepta el inicio de nuevas sesiones.
  if (await hasReachedResponseQuota(published.workspaceId)) {
    return <QuotaReachedScreen businessName={published.snapshot.businessName} />;
  }

  return <PublicRunner snapshot={published.snapshot} />;
}
