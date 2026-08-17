import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2 font-semibold", className)}
    >
      <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
        F
      </span>
      <span className="text-base tracking-tight">AI Funnel Creator</span>
    </Link>
  );
}
