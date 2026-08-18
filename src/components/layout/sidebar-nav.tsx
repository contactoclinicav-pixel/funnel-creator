"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

/**
 * Nav del sidebar petróleo: fila de 38px, dot de 5px sólo en el activo,
 * inactivo en #9BB4C4 y hover con velo claro (rgba(231,238,242,.09)).
 */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="grid gap-0.5">
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex h-[38px] items-center gap-2.5 rounded-[10px] px-3 text-[14.5px] transition-colors transition-brand duration-150",
              active
                ? "bg-[rgba(231,238,242,.12)] font-semibold text-[#FCFBF9]"
                : "font-normal text-[#9BB4C4] hover:bg-[rgba(231,238,242,.09)] hover:text-[#FCFBF9]"
            )}
          >
            <span
              className={cn(
                "size-[5px] shrink-0 rounded-full",
                active ? "bg-[#7FA8C4]" : "bg-transparent"
              )}
            />
            <span className="flex-1 truncate">{item.title}</span>
            {item.comingSoon ? (
              <span className="rounded-full bg-[rgba(231,238,242,.12)] px-1.5 py-0.5 text-[10px] font-medium text-[#9BB4C4]">
                pronto
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
