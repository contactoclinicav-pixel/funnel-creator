import { cn } from "@/lib/utils";

/**
 * Card KPI del handoff: blanca, borde 1px, radius 14px, padding 20px.
 * Label 13.5px, valor 34px Inter Tight, delta pill en accent tint.
 */
export function KpiCard({
  label,
  value,
  delta,
  deltaSuffix = "%",
  periodLabel,
}: {
  label: string;
  value: string;
  delta?: number | null;
  deltaSuffix?: string;
  periodLabel: string;
}) {
  const hasDelta = delta !== null && delta !== undefined;
  const positive = hasDelta && delta >= 0;

  return (
    <div className="rounded-[14px] border border-line bg-card p-5">
      <p className="text-[13.5px] text-ink-primary">{label}</p>
      <div className="mt-2.5 flex items-baseline gap-2.5">
        <span className="display text-[34px] leading-none text-ink tabular-nums">
          {value}
        </span>
        {hasDelta ? (
          <span
            className={cn(
              "rounded-full px-2 py-[3px] text-[12px] font-semibold tabular-nums",
              positive
                ? "bg-brand-tint text-brand"
                : "bg-[#F2ECE4] text-[#A18463]"
            )}
          >
            {positive ? "+" : ""}
            {delta}
            {deltaSuffix}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-[12.5px] text-ink-secondary">{periodLabel}</p>
    </div>
  );
}
