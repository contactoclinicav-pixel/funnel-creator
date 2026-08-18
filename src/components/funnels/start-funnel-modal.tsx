"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { createFunnelAction } from "@/app/(app)/funnels/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SparkleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3c.4 3.6 1.4 4.6 5 5-3.6.4-4.6 1.4-5 5-.4-3.6-1.4-4.6-5-5 3.6-.4 4.6-1.4 5-5Z"
        fill="currentColor"
      />
      <path
        d="M19 14c.2 1.8.7 2.3 2.5 2.5-1.8.2-2.3.7-2.5 2.5-.2-1.8-.7-2.3-2.5-2.5 1.8-.2 2.3-.7 2.5-2.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function TemplateIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

/**
 * Modal "¿Cómo quieres empezar?" del handoff: dos tarjetas (Crear con IA /
 * Usar template) más un enlace discreto para empezar en blanco.
 */
export function StartFunnelModal({
  triggerLabel = "+ Crear funnel",
  size = "default",
  className,
  defaultOpen = false,
}: {
  triggerLabel?: string;
  size?: "default" | "lg";
  className?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [mode, setMode] = useState<"choose" | "blank">("choose");
  const [creating, setCreating] = useState(false);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setMode("choose");
  }

  async function onSubmitBlank(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setCreating(true);
    const result = await createFunnelAction(form);
    // Si la acción redirige al editor, nunca llegamos aquí.
    setCreating(false);
    if (result?.error) {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size={size} className={className}>
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[680px] rounded-[20px] p-8">
        {mode === "choose" ? (
          <>
            <DialogHeader>
              <DialogTitle className="display text-[22px] text-ink">
                ¿Cómo quieres empezar?
              </DialogTitle>
              <DialogDescription className="text-[14px] text-ink-primary">
                Elige el camino que mejor se ajuste a tu negocio.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Link
                href="/create-ai"
                className="group flex flex-col rounded-2xl border border-line p-5 text-left transition-colors transition-brand hover:border-brand"
              >
                <span className="flex size-11 items-center justify-center rounded-[14px] bg-brand-tint text-brand">
                  <SparkleIcon />
                </span>
                <h3 className="mt-4 text-[16px] font-semibold text-ink">
                  Crear con IA
                </h3>
                <p className="mt-1.5 text-[13.5px] text-ink-primary">
                  Describe tu negocio y tu objetivo. La IA genera tu funnel
                  completo.
                </p>
                <span className="mt-4 inline-flex h-9 items-center justify-center rounded-[10px] bg-primary px-4 text-[13.5px] font-medium text-primary-foreground transition-colors group-hover:bg-brand-hover">
                  Empezar con IA
                </span>
              </Link>

              <Link
                href="/templates"
                className="group flex flex-col rounded-2xl border border-line p-5 text-left transition-colors transition-brand hover:border-brand"
              >
                <span className="flex size-11 items-center justify-center rounded-[14px] bg-surface text-ink-primary">
                  <TemplateIcon />
                </span>
                <h3 className="mt-4 text-[16px] font-semibold text-ink">
                  Usar template
                </h3>
                <p className="mt-1.5 text-[13.5px] text-ink-primary">
                  Elige una plantilla probada y personalízala a tu marca.
                </p>
                <span className="mt-4 inline-flex h-9 items-center justify-center rounded-[10px] border border-line-strong px-4 text-[13.5px] font-medium text-ink transition-colors group-hover:bg-[#EAE8E4]">
                  Explorar templates
                </span>
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setMode("blank")}
              className="mt-5 w-full text-center text-[13px] text-ink-secondary underline-offset-4 hover:text-ink hover:underline"
            >
              o empieza con un funnel en blanco
            </button>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="display text-[22px] text-ink">
                Funnel en blanco
              </DialogTitle>
              <DialogDescription className="text-[14px] text-ink-primary">
                Ponle un nombre; podrás cambiarlo cuando quieras.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmitBlank} className="mt-4 grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="blank-funnel-name">Nombre del funnel</Label>
                <Input
                  id="blank-funnel-name"
                  name="name"
                  placeholder="Descubre tu tratamiento ideal"
                  minLength={2}
                  maxLength={80}
                  required
                  autoFocus
                />
              </div>
              <label className="flex items-center gap-2 text-[13.5px] text-ink-primary">
                <input
                  type="checkbox"
                  name="applyBrand"
                  defaultChecked
                  className="size-4 rounded border-line-strong accent-brand"
                />
                Aplicar mi marca (logo, color y tipografía)
              </label>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setMode("choose")}
                  className="text-[13px] text-ink-secondary underline-offset-4 hover:text-ink hover:underline"
                >
                  Volver
                </button>
                <Button type="submit" disabled={creating}>
                  {creating ? "Creando…" : "Crear funnel"}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
