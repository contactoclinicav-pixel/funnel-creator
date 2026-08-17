"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createFunnelAction } from "@/app/(app)/funnels/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateFunnelDialog({
  defaultOpen = false,
  triggerVariant = "default",
}: {
  defaultOpen?: boolean;
  triggerVariant?: "default" | "outline";
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [creating, setCreating] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant}>
          <Plus className="size-4" />
          Nuevo funnel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo funnel</DialogTitle>
          <DialogDescription>
            Ponle un nombre; podrás cambiarlo cuando quieras. La URL pública se
            genera automáticamente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="new-funnel-name">Nombre del funnel</Label>
            <Input
              id="new-funnel-name"
              name="name"
              placeholder="Descubre tu tratamiento ideal"
              minLength={2}
              maxLength={80}
              required
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={creating}>
              {creating ? "Creando…" : "Crear funnel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
