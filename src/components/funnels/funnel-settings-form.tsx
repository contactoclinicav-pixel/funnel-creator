"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateFunnelSettingsAction } from "@/app/(app)/funnels/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function FunnelSettingsForm({
  funnel,
}: {
  funnel: {
    id: string;
    name: string;
    slug: string;
    goal: string | null;
    industry: string | null;
    audience: string | null;
  };
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    const result = await updateFunnelSettingsAction(form);
    setSaving(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Cambios guardados.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <input type="hidden" name="funnelId" value={funnel.id} />
      <div className="grid gap-2">
        <Label htmlFor="funnel-name">Nombre</Label>
        <Input
          id="funnel-name"
          name="name"
          defaultValue={funnel.name}
          minLength={2}
          maxLength={80}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="funnel-slug">URL pública</Label>
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">/f/</span>
          <Input
            id="funnel-slug"
            name="slug"
            defaultValue={funnel.slug}
            minLength={2}
            maxLength={60}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            title="Solo minúsculas, números y guiones"
            required
            className="font-mono"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Solo minúsculas, números y guiones. Cambiarla romperá enlaces ya
          compartidos.
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="funnel-goal">Objetivo</Label>
        <Textarea
          id="funnel-goal"
          name="goal"
          defaultValue={funnel.goal ?? ""}
          placeholder="Ej.: captar pacientes interesados en tratamientos de flacidez facial"
          maxLength={200}
          rows={2}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="funnel-industry">Industria</Label>
          <Input
            id="funnel-industry"
            name="industry"
            defaultValue={funnel.industry ?? ""}
            placeholder="Ej.: clínica estética"
            maxLength={120}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="funnel-audience">Público</Label>
          <Input
            id="funnel-audience"
            name="audience"
            defaultValue={funnel.audience ?? ""}
            placeholder="Ej.: mujeres 35-60 interesadas en estética facial"
            maxLength={200}
          />
        </div>
      </div>
      <div>
        <Button type="submit" disabled={saving}>
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
