"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { addLeadNoteAction } from "@/app/(app)/leads/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function LeadNoteForm({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const body = String(new FormData(formElement).get("body") ?? "");
    setSaving(true);
    const result = await addLeadNoteAction({ leadId, body });
    setSaving(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    formElement.reset();
    toast.success("Nota añadida.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-2">
      <Textarea
        name="body"
        placeholder="Escribe una nota interna…"
        rows={3}
        maxLength={2000}
        required
      />
      <div>
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? "Guardando…" : "Añadir nota"}
        </Button>
      </div>
    </form>
  );
}
