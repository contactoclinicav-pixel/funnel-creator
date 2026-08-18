import Link from "next/link";

import { PageHeader, UnderlineTabs } from "@/components/layout/page-header";
import { LeadStatusBadge } from "@/components/leads/lead-status";
import { requireWorkspace } from "@/server/context";
import { listLeads } from "@/server/services/lead";
import { prisma } from "@/lib/db";
import type { LeadStatus } from "@/generated/prisma/enums";

export const metadata = { title: "Leads" };

const STATUS_FILTERS: { key: string; label: string; status?: LeadStatus }[] = [
  { key: "todos", label: "Todos" },
  { key: "nuevos", label: "Nuevos", status: "NEW" },
  { key: "contactados", label: "Contactados", status: "CONTACTED" },
  { key: "calificados", label: "Calificados", status: "QUALIFIED" },
  { key: "convertidos", label: "Convertidos", status: "CONVERTED" },
  { key: "perdidos", label: "Perdidos", status: "LOST" },
];

export default async function LeadsPage({ searchParams }: PageProps<"/leads">) {
  const ctx = await requireWorkspace();
  const params = await searchParams;
  const filterKey = typeof params.estado === "string" ? params.estado : "todos";
  const filter =
    STATUS_FILTERS.find((f) => f.key === filterKey) ?? STATUS_FILTERS[0];
  const funnelId = typeof params.funnel === "string" ? params.funnel : undefined;

  const [leads, funnelFilter] = await Promise.all([
    listLeads(ctx, { status: filter.status, funnelId }),
    funnelId
      ? prisma.funnel.findFirst({
          where: { id: funnelId, workspaceId: ctx.workspaceId },
          select: { name: true },
        })
      : Promise.resolve(null),
  ]);

  const dateFormatter = new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  function filterHref(key: string) {
    const next = new URLSearchParams();
    if (key !== "todos") next.set("estado", key);
    if (funnelId) next.set("funnel", funnelId);
    const qs = next.toString();
    return qs ? `/leads?${qs}` : "/leads";
  }

  return (
    <div className="mx-auto grid max-w-[1180px] gap-6">
      <PageHeader
        title="Leads"
        description={
          funnelFilter
            ? `Leads del funnel «${funnelFilter.name}»`
            : `${leads.length} contactos captados por tus funnels`
        }
        actions={
          funnelFilter ? (
            <Link
              href="/leads"
              className="text-[13.5px] font-medium text-brand underline-offset-4 hover:underline"
            >
              Quitar filtro de funnel
            </Link>
          ) : undefined
        }
      />

      <UnderlineTabs
        activeKey={filter.key}
        items={STATUS_FILTERS.map((f) => ({
          key: f.key,
          label: f.label,
          href: filterHref(f.key),
        }))}
      />

      {leads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-soft bg-card px-6 py-16 text-center">
          <p className="display text-[18px] text-ink">
            {filter.status
              ? `No hay leads en «${filter.label}»`
              : "Todavía no tienes leads"}
          </p>
          <p className="mx-auto mt-1.5 max-w-sm text-[14.5px] text-ink-primary">
            Publica un funnel y comparte su enlace para empezar a captar
            contactos.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="bg-[#F7F6F3] text-left">
                  {["Nombre", "Contacto", "Funnel", "Resultado", "Fecha", "Estado"].map(
                    (label, i) => (
                      <th
                        key={label}
                        className={`px-4 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.045em] text-ink-secondary ${
                          i === 0 ? "pl-6" : ""
                        } ${i === 5 ? "pr-6" : ""}`}
                      >
                        {label}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-t border-[#F1F0ED] transition-colors hover:bg-[#F7F6F3]"
                  >
                    <td className="py-3 pl-6 pr-4">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="text-[14.5px] font-medium text-ink hover:underline"
                      >
                        {lead.name || "Sin nombre"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-ink-primary">
                      <p>{lead.email || "—"}</p>
                      {lead.phone ? (
                        <p className="text-ink-secondary">{lead.phone}</p>
                      ) : null}
                    </td>
                    <td className="max-w-44 truncate px-4 py-3 text-[13.5px] text-ink">
                      {lead.funnel.name}
                    </td>
                    <td className="max-w-40 truncate px-4 py-3 text-[13.5px] text-ink">
                      {lead.resultTitle ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-ink-secondary">
                      {dateFormatter.format(lead.createdAt)}
                    </td>
                    <td className="py-3 pl-4 pr-6">
                      <LeadStatusBadge status={lead.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
