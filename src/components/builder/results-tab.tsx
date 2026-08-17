"use client";

import { Plus, Trash2 } from "lucide-react";

import {
  addProfileAction,
  deleteProfileAction,
  updateProfileAction,
} from "@/app/(app)/funnels/[funnelId]/edit/actions";
import { useBuilderAction } from "@/components/builder/use-builder-action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SnapshotProfile } from "@/lib/funnel-config";

export function ResultsTab({
  funnelId,
  profiles,
}: {
  funnelId: string;
  profiles: SnapshotProfile[];
}) {
  const { run, pending } = useBuilderAction();

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {profiles.length === 0
            ? "Crea perfiles de resultado; el de mayor puntuación gana."
            : `${profiles.length} perfil${profiles.length === 1 ? "" : "es"} de resultado.`}
        </p>
        <Button
          disabled={pending}
          onClick={() => run(addProfileAction({ funnelId }), "Perfil creado.")}
        >
          <Plus className="size-4" />
          Añadir perfil
        </Button>
      </div>

      {profiles.map((profile, index) => (
        <ProfileCard
          key={profile.id}
          funnelId={funnelId}
          profile={profile}
          index={index}
        />
      ))}
    </div>
  );
}

function ProfileCard({
  funnelId,
  profile,
  index,
}: {
  funnelId: string;
  profile: SnapshotProfile;
  index: number;
}) {
  const { run, pending } = useBuilderAction();

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await run(
      updateProfileAction({
        funnelId,
        profileId: profile.id,
        title: String(form.get("title") ?? ""),
        description: String(form.get("description") ?? ""),
        recommendation: String(form.get("recommendation") ?? ""),
        imageUrl: String(form.get("imageUrl") ?? ""),
      }),
      "Perfil guardado."
    );
  }

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="flex-row items-center justify-between px-4">
        <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
          {String.fromCharCode(65 + index)}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={pending}
          title="Eliminar perfil"
          onClick={() =>
            run(
              deleteProfileAction({ funnelId, profileId: profile.id }),
              "Perfil eliminado (y sus reglas asociadas)."
            )
          }
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </CardHeader>
      <CardContent className="px-4">
        <form onSubmit={save} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor={`p-title-${profile.id}`}>Título</Label>
            <Input
              id={`p-title-${profile.id}`}
              name="title"
              defaultValue={profile.title}
              maxLength={120}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`p-desc-${profile.id}`}>Descripción</Label>
            <Textarea
              id={`p-desc-${profile.id}`}
              name="description"
              defaultValue={profile.description ?? ""}
              maxLength={600}
              rows={2}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`p-reco-${profile.id}`}>Recomendación</Label>
            <Textarea
              id={`p-reco-${profile.id}`}
              name="recommendation"
              defaultValue={profile.recommendation ?? ""}
              maxLength={600}
              rows={2}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`p-img-${profile.id}`}>
              Imagen (URL) <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id={`p-img-${profile.id}`}
              name="imageUrl"
              type="url"
              defaultValue={profile.imageUrl ?? ""}
              placeholder="https://…"
            />
          </div>
          <div>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
