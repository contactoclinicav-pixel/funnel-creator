import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PUBLISHED: { label: "Publicado", className: "bg-brand-tint text-brand" },
  DRAFT: { label: "Borrador", className: "bg-draft text-draft-foreground" },
  ARCHIVED: {
    label: "Archivado",
    className: "bg-archived text-archived-foreground",
  },
};

/** Badge pill de estado del funnel, con los colores del handoff. */
export function FunnelStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-muted text-ink-secondary",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-[3px] text-[12px] font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
