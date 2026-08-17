import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { DeleteLeadButton } from "@/components/leads/delete-lead-button";
import { LeadNoteForm } from "@/components/leads/lead-notes";
import { LeadStatusSelect } from "@/components/leads/lead-status";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireWorkspace } from "@/server/context";
import { getLeadDetail } from "@/server/services/lead";

export const metadata = { title: "Detalle del lead" };

export default async function LeadDetailPage({
  params,
}: PageProps<"/leads/[leadId]">) {
  const ctx = await requireWorkspace();
  const { leadId } = await params;
  const detail = await getLeadDetail(ctx, leadId);
  if (!detail) {
    notFound();
  }
  const { lead, answers, resultTitle, notes } = detail;

  const dateFormatter = new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const infoRows: { label: string; value: React.ReactNode }[] = [
    { label: "Email", value: lead.email || "—" },
    { label: "Teléfono", value: lead.phone || "—" },
    { label: "Ciudad", value: lead.city || "—" },
    {
      label: "Consentimiento",
      value: lead.consent ? "Aceptado" : "No aceptado",
    },
    { label: "Fecha", value: dateFormatter.format(lead.createdAt) },
    { label: "Resultado", value: resultTitle ?? "—" },
    { label: "CTA utilizado", value: lead.ctaClicked ?? "—" },
    {
      label: "Fuente",
      value: lead.session?.utmSource
        ? [
            lead.session.utmSource,
            lead.session.utmMedium,
            lead.session.utmCampaign,
          ]
            .filter(Boolean)
            .join(" · ")
        : (lead.session?.referrer ?? "Directa"),
    },
  ];

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/leads">
              <ArrowLeft className="size-4" />
              <span className="sr-only">Volver a Leads</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {lead.name || "Lead sin nombre"}
            </h1>
            <p className="text-xs text-muted-foreground">
              vía{" "}
              <Link
                href={`/funnels/${lead.funnel.id}/edit`}
                className="underline underline-offset-4 hover:text-foreground"
              >
                {lead.funnel.name}
              </Link>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LeadStatusSelect leadId={lead.id} status={lead.status} />
          <DeleteLeadButton
            leadId={lead.id}
            leadName={lead.name || "este lead"}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-2.5 text-sm">
              {infoRows.map((row) => (
                <div key={row.label} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd className="text-right font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>
            {lead.email ? (
              <>
                <Separator className="my-4" />
                <Button asChild variant="outline" size="sm">
                  <a href={`mailto:${lead.email}`}>
                    <ExternalLink className="size-4" />
                    Escribir email
                  </a>
                </Button>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Respuestas</CardTitle>
            <CardDescription>
              Lo que respondió en el funnel
              {lead.session?.version
                ? ` (versión ${lead.session.version.versionNumber})`
                : ""}
              .
            </CardDescription>
          </CardHeader>
          <CardContent>
            {answers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay respuestas registradas para este lead.
              </p>
            ) : (
              <ol className="grid gap-3">
                {answers.map((answer, i) => (
                  <li key={i} className="text-sm">
                    <p className="text-muted-foreground">
                      {answer.questionTitle}
                    </p>
                    <p className="font-medium">{answer.display}</p>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notas internas</CardTitle>
          <CardDescription>
            Solo visibles para tu equipo, nunca para el lead.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <LeadNoteForm leadId={lead.id} />
          {notes.length > 0 ? (
            <ul className="grid gap-3">
              {notes.map((note) => (
                <li key={note.id} className="rounded-lg border p-3 text-sm">
                  <p className="whitespace-pre-wrap">{note.body}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {note.authorName} · {dateFormatter.format(note.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
