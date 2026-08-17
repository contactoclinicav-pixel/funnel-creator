import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicRunner } from "@/components/runner/public-runner";
import {
  getPublishedFunnelBySlug,
  logEvent,
} from "@/server/services/public-runner";

// La página pública siempre sirve la última versión publicada.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/f/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const published = await getPublishedFunnelBySlug(slug);
  if (!published) return { title: "Funnel no disponible" };
  return {
    title: published.snapshot.intro.headline,
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

  return <PublicRunner snapshot={published.snapshot} />;
}
