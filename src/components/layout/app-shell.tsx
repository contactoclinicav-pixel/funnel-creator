"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo, Wordmark } from "@/components/brand/logo";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { StartFunnelModal } from "@/components/funnels/start-funnel-modal";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

/** Título y breadcrumb del header derivados de la ruta activa. */
function usePageTitle() {
  const pathname = usePathname();
  const item =
    NAV_ITEMS.find(
      (nav) => pathname === nav.href || pathname.startsWith(`${nav.href}/`)
    ) ?? NAV_ITEMS[0];
  const isDetail = pathname !== item.href;
  return {
    breadcrumb: isDetail ? item.title : "aifunnel",
    title: isDetail ? detailTitle(pathname, item.title) : item.title,
    section: item.title,
  };
}

function detailTitle(pathname: string, section: string): string {
  if (pathname.includes("/edit")) return "Funnel builder";
  if (section === "Leads") return "Detalle del lead";
  if (section === "Analytics") return "Rendimiento del funnel";
  return section;
}

export function AppShell({
  user,
  workspaceName,
  children,
}: {
  user: { name: string; email: string };
  workspaceName: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { breadcrumb, title } = usePageTitle();

  const initials =
    user.name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  const sidebarBody = (
    <>
      <div className="flex-1 overflow-y-auto px-3.5 py-5">
        <SidebarNav onNavigate={() => setMobileOpen(false)} />
      </div>
      <div className="px-3.5 pb-5">
        <Link
          href="/settings"
          className="block px-3 py-2 text-[13px] text-[#9BB4C4] transition-colors hover:text-[#FCFBF9]"
        >
          ayuda y soporte
        </Link>
        <div className="mt-2 border-t border-[rgba(231,238,242,.16)] pt-3.5">
          <div className="flex items-center gap-2.5 px-1">
            <span className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-brand-tint text-[12.5px] font-semibold text-brand">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-medium text-[#FCFBF9]">
                {user.name}
              </p>
              <p className="truncate text-[12px] text-[#9BB4C4]">
                {workspaceName}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-svh w-full bg-background">
      {/* Sidebar desktop — 248px, gradiente petróleo */}
      <aside className="surface-brand hidden w-[248px] shrink-0 flex-col border-r border-[#14303F] md:flex">
        <div className="px-5 pt-5 pb-1">
          <Logo href="/dashboard" onDark size={23} />
        </div>
        {sidebarBody}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header 68px */}
        <header className="sticky top-0 z-20 flex h-[68px] shrink-0 items-center gap-3 border-b border-line bg-background px-4 md:px-8">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <MenuIcon />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="surface-brand w-[300px] border-none p-0"
            >
              <SheetHeader className="px-5 pt-5 pb-1">
                <SheetTitle asChild>
                  <span>
                    <Wordmark onDark size={22} />
                  </span>
                </SheetTitle>
              </SheetHeader>
              <div className="flex min-h-0 flex-1 flex-col">{sidebarBody}</div>
            </SheetContent>
          </Sheet>

          <div className="min-w-0 md:hidden">
            <Wordmark size={19} />
          </div>

          <div className="hidden min-w-0 md:block">
            <p className="text-[12px] text-ink-secondary">{breadcrumb}</p>
            <p className="display truncate text-[20px] text-ink">{title}</p>
          </div>

          <div className="ml-auto flex items-center gap-2.5">
            <button
              type="button"
              className="relative flex size-[38px] items-center justify-center rounded-[10px] border border-line text-ink-primary transition-colors hover:bg-[#F7F6F3]"
              aria-label="Notificaciones"
            >
              <BellIcon />
              <span className="absolute right-2.5 top-2.5 size-1.5 rounded-full bg-brand" />
            </button>
            <StartFunnelModal className="hidden h-[38px] sm:inline-flex" />
            <UserMenu name={user.name} email={user.email} />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
