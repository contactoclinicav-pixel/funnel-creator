"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  Copy,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  archiveFunnelAction,
  deleteFunnelAction,
  duplicateFunnelAction,
  restoreFunnelAction,
} from "@/app/(app)/funnels/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function FunnelRowActions({
  funnel,
}: {
  funnel: {
    id: string;
    name: string;
    status: string;
    leadCount: number;
    sessionCount: number;
    slug?: string;
  };
}) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  function withFunnelId() {
    const form = new FormData();
    form.set("funnelId", funnel.id);
    return form;
  }

  async function run(
    action: (form: FormData) => Promise<{ error?: string } | undefined>,
    successMessage: string
  ) {
    setBusy(true);
    try {
      const result = await action(withFunnelId());
      if (result?.error) {
        toast.error(result.error);
        return false;
      }
      toast.success(successMessage);
      router.refresh();
      return true;
    } catch {
      toast.error("No se pudo completar la acción. Inténtalo de nuevo.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  const hasData = funnel.leadCount > 0 || funnel.sessionCount > 0;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={busy}>
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Acciones de {funnel.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`/funnels/${funnel.id}/edit`}>
              <Pencil className="size-4" />
              Editar
            </Link>
          </DropdownMenuItem>
          {funnel.status === "PUBLISHED" && funnel.slug ? (
            <DropdownMenuItem asChild>
              <a
                href={`/f/${funnel.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-4" />
                Ver funnel público
              </a>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem
            onClick={() => run(duplicateFunnelAction, "Funnel duplicado.")}
          >
            <Copy className="size-4" />
            Duplicar
          </DropdownMenuItem>
          {funnel.status === "ARCHIVED" ? (
            <DropdownMenuItem
              onClick={() =>
                run(restoreFunnelAction, "Funnel restaurado como borrador.")
              }
            >
              <ArchiveRestore className="size-4" />
              Restaurar
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => run(archiveFunnelAction, "Funnel archivado.")}
            >
              <Archive className="size-4" />
              Archivar
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="size-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Eliminar «{funnel.name}»?</DialogTitle>
            <DialogDescription>
              {hasData
                ? `Se eliminarán también ${funnel.sessionCount} sesiones de respuesta y ${funnel.leadCount} leads asociados. `
                : ""}
              Esta acción es definitiva y no se puede deshacer. Si solo quieres
              retirarlo, usa «Archivar».
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(false)}
              disabled={busy}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={async () => {
                const ok = await run(
                  deleteFunnelAction,
                  "Funnel eliminado definitivamente."
                );
                if (ok) {
                  setConfirmDelete(false);
                }
              }}
            >
              {busy ? "Eliminando…" : "Eliminar definitivamente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
