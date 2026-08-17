"use client";

import { useState } from "react";
import { toast } from "sonner";

import { updateWorkspaceNameAction } from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WorkspaceForm({
  initialName,
  canEdit,
}: {
  initialName: string;
  canEdit: boolean;
}) {
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    const result = await updateWorkspaceNameAction(form);
    setSaving(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Workspace actualizado.");
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="workspace-name">Nombre del workspace</Label>
        <Input
          id="workspace-name"
          name="name"
          defaultValue={initialName}
          disabled={!canEdit}
          required
        />
        {!canEdit ? (
          <p className="text-xs text-muted-foreground">
            Solo el propietario o un administrador puede cambiar el nombre.
          </p>
        ) : null}
      </div>
      <div>
        <Button type="submit" disabled={saving || !canEdit}>
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
