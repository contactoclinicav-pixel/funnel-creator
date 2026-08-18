import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Wordmark tipográfico: "aifunnel" en Inter Tight 700 lowercase con el
 * prefijo "ai" coloreado — petróleo sobre claro, azul claro sobre oscuro.
 * No hay logo gráfico; la marca es tipográfica.
 */
export function Wordmark({
  onDark = false,
  className,
  size = 23,
}: {
  onDark?: boolean;
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={cn("font-display font-bold lowercase leading-none", className)}
      style={{
        fontSize: size,
        letterSpacing: size >= 32 ? "-0.075em" : "-0.05em",
        color: onDark ? "#FCFBF9" : "var(--ink)",
      }}
    >
      <span style={{ color: onDark ? "#7FA8C4" : "#1D3F52" }}>ai</span>funnel
    </span>
  );
}

export function Logo({
  className,
  href = "/",
  onDark = false,
  size,
}: {
  className?: string;
  href?: string;
  onDark?: boolean;
  size?: number;
}) {
  return (
    <Link href={href} className={cn("inline-flex items-center", className)}>
      <Wordmark onDark={onDark} size={size} />
    </Link>
  );
}
