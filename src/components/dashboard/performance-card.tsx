"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { SeriesPoint } from "@/server/services/dashboard";
import { cn } from "@/lib/utils";

const RANGES = [7, 30, 90] as const;

/**
 * Card "Rendimiento": superficie petróleo con gráfico de líneas SVG.
 * Visitas #9FC5DC, Leads #7A9BB0, Conversiones en blanco al 40%.
 */
export function PerformanceCard({
  series,
  range,
}: {
  series: SeriesPoint[];
  range: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState<number | null>(null);

  function selectRange(days: number) {
    setPending(days);
    const params = new URLSearchParams(searchParams.toString());
    params.set("dias", String(days));
    router.push(`/dashboard?${params.toString()}`);
  }

  const paths = useMemo(() => buildPaths(series), [series]);
  const hasData = series.some(
    (point) => point.views > 0 || point.leads > 0 || point.conversions > 0
  );

  return (
    <div className="surface-brand-card rounded-2xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="display text-[20px] text-[#FCFBF9]">Rendimiento</h2>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <Legend color="#9FC5DC" label="Visitas" />
            <Legend color="#7A9BB0" label="Leads" />
            <Legend color="rgba(252,251,249,.4)" label="Conversiones" />
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-[rgba(231,238,242,.12)] p-1">
          {RANGES.map((days) => {
            const active = (pending ?? range) === days;
            return (
              <button
                key={days}
                type="button"
                onClick={() => selectRange(days)}
                className={cn(
                  "rounded-full px-3 py-1 text-[12.5px] font-medium transition-colors transition-brand",
                  active
                    ? "bg-[#FCFBF9] text-brand"
                    : "text-[#B9CCD8] hover:text-[#FCFBF9]"
                )}
              >
                {days} días
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative mt-5 h-[230px]">
        {hasData ? (
          <svg
            viewBox="0 0 800 230"
            preserveAspectRatio="none"
            className="h-full w-full"
            aria-label="Evolución de visitas, leads y conversiones"
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={i}
                x1="0"
                x2="800"
                y1={i * 57.5}
                y2={i * 57.5}
                stroke="rgba(252,251,249,.08)"
                strokeWidth="1"
              />
            ))}
            <path d={paths.viewsArea} fill="rgba(231,238,242,.10)" />
            <path
              d={paths.views}
              fill="none"
              stroke="#9FC5DC"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={paths.leads}
              fill="none"
              stroke="#7A9BB0"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={paths.conversions}
              fill="none"
              stroke="rgba(252,251,249,.4)"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="max-w-xs text-center text-[13.5px] text-[#9BB4C4]">
              Aún no hay actividad en este periodo. Publica un funnel y comparte
              su enlace para empezar a medir.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[12.5px] text-[#B9CCD8]">
      <span
        className="inline-block h-[2px] w-3.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

function buildPaths(series: SeriesPoint[]) {
  const width = 800;
  const height = 230;
  const max = Math.max(
    1,
    ...series.map((p) => Math.max(p.views, p.leads, p.conversions))
  );
  const step = series.length > 1 ? width / (series.length - 1) : width;

  const toPath = (key: "views" | "leads" | "conversions") =>
    series
      .map((point, i) => {
        const x = i * step;
        const y = height - (point[key] / max) * (height - 16) - 8;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  const views = toPath("views");
  return {
    views,
    leads: toPath("leads"),
    conversions: toPath("conversions"),
    viewsArea: `${views} L${width},${height} L0,${height} Z`,
  };
}
