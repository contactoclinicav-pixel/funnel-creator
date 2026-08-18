import { FunnelStatusBadge } from "@/components/funnels/status-badge";
import { cn } from "@/lib/utils";

/**
 * Thumbnail de funnel: superficie petróleo con mini-wordmark, badge de estado
 * y barras skeleton claras que sugieren la estructura del funnel.
 */
export function FunnelThumb({
  status,
  height = 150,
  compact = false,
  className,
}: {
  status: string;
  height?: number;
  compact?: boolean;
  className?: string;
}) {
  const isDraft = status === "DRAFT";

  // En tamaño compacto (tablas) el tile es sólo la superficie, sin contenido.
  if (compact) {
    return (
      <span
        className={cn(
          "block shrink-0 rounded-[10px]",
          isDraft ? "border border-line bg-surface" : "surface-brand-thumb",
          className
        )}
        style={{ height, width: height }}
        aria-hidden
      />
    );
  }

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between overflow-hidden rounded-2xl p-4",
        isDraft ? "bg-surface" : "surface-brand-thumb",
        className
      )}
      style={{ height }}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "font-display text-[13px] font-bold lowercase tracking-[-0.05em]",
            isDraft ? "text-ink-secondary" : "text-[#FCFBF9]"
          )}
        >
          <span className={isDraft ? "text-brand" : "text-[#7FA8C4]"}>ai</span>
          funnel
        </span>
        <FunnelStatusBadge status={status} />
      </div>

      <div className="grid gap-1.5">
        <span
          className={cn(
            "h-1.5 w-3/4 rounded-full",
            isDraft ? "bg-line-soft" : "bg-[rgba(252,251,249,.30)]"
          )}
        />
        <span
          className={cn(
            "h-1.5 w-1/2 rounded-full",
            isDraft ? "bg-line" : "bg-[rgba(252,251,249,.16)]"
          )}
        />
        <span
          className={cn(
            "mt-1.5 h-[18px] w-[68px] rounded-md",
            isDraft ? "bg-line-soft" : "bg-brand-tint"
          )}
        />
      </div>
    </div>
  );
}
