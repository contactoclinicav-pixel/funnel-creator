"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";

import { updateLeadStatusAction } from "@/app/(app)/leads/actions";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const LEAD_STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  NEW: { label: "Nuevo", className: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" },
  CONTACTED: { label: "Contactado", className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  QUALIFIED: { label: "Calificado", className: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300" },
  CONVERTED: { label: "Convertido", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
  LOST: { label: "Perdido", className: "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400" },
};

export function LeadStatusBadge({ status }: { status: string }) {
  const config = LEAD_STATUS_CONFIG[status] ?? {
    label: status,
    className: "",
  };
  return (
    <Badge variant="secondary" className={cn("border-transparent", config.className)}>
      {config.label}
    </Badge>
  );
}

/** Badge clicable que despliega el cambio de estado. */
export function LeadStatusSelect({
  leadId,
  status,
}: {
  leadId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function change(next: string) {
    if (next === status) return;
    setBusy(true);
    try {
      const result = await updateLeadStatusAction({ leadId, status: next });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Estado actualizado.");
      router.refresh();
    } catch {
      toast.error("No se pudo completar la acción. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={busy}
        className="inline-flex items-center gap-1 rounded-md outline-none focus-visible:ring-2"
      >
        <LeadStatusBadge status={status} />
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {Object.entries(LEAD_STATUS_CONFIG).map(([value, config]) => (
          <DropdownMenuItem key={value} onClick={() => change(value)}>
            <span
              className={cn(
                "size-2 rounded-full",
                config.className.split(" ")[0]
              )}
            />
            {config.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
