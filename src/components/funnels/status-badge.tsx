import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  DRAFT: { label: "Borrador", variant: "secondary" },
  PUBLISHED: { label: "Publicado", variant: "default" },
  ARCHIVED: { label: "Archivado", variant: "outline" },
};

export function FunnelStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    variant: "outline" as const,
  };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
