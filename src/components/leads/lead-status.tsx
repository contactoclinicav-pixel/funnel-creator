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

/** Estados de lead con la paleta del sistema: petróleo, arena y marfil. */
export const LEAD_STATUS_CONFIG: Record<
  string,
  { label: string; className: string; dot: string }
> = {
  NEW: {
    label: "Nuevo",
    className: "bg-brand-tint text-brand",
    dot: "bg-brand",
  },
  CONTACTED: {
    label: "Contactado",
    className: "bg-draft text-draft-foreground",
    dot: "bg-draft-foreground",
  },
  QUALIFIED: {
    label: "Calificado",
    className: "bg-[#E4EAEE] text-[#3E6076]",
    dot: "bg-[#3E6076]",
  },
  CONVERTED: {
    label: "Convertido",
    className: "bg-brand text-[#FCFBF9]",
    dot: "bg-[#7FA8C4]",
  },
  LOST: {
    label: "Perdido",
    className: "bg-archived text-archived-foreground",
    dot: "bg-archived-foreground",
  },
};

export function LeadStatusBadge({ status }: { status: string }) {
  const config = LEAD_STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-muted text-ink-secondary",
    dot: "bg-ink-secondary",
  };
  return (
    <Badge
      variant="secondary"
      className={cn(
        "rounded-full border-transparent px-2.5 py-[3px] text-[12px] font-medium",
        config.className
      )}
    >
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
            <span className={cn("size-2 rounded-full", config.dot)} />
            {config.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
