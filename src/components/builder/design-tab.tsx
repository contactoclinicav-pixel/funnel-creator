"use client";

import { applyBrandToFunnelAction } from "@/app/(app)/funnels/actions";
import {
  updateIntroAction,
  updateThemeAction,
} from "@/app/(app)/funnels/[funnelId]/edit/actions";
import { useBuilderAction } from "@/components/builder/use-builder-action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  FONT_OPTIONS,
  type IntroConfig,
  type ThemeConfig,
} from "@/lib/funnel-config";

export function DesignTab({
  funnelId,
  intro,
  theme,
}: {
  funnelId: string;
  intro: IntroConfig;
  theme: ThemeConfig;
}) {
  const introAction = useBuilderAction();
  const themeAction = useBuilderAction();
  const brandAction = useBuilderAction();

  async function applyBrand() {
    const form = new FormData();
    form.set("funnelId", funnelId);
    await brandAction.run(applyBrandToFunnelAction(form), "Marca aplicada.");
  }

  async function saveIntro(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await introAction.run(
      updateIntroAction({
        funnelId,
        intro: {
          headline: form.get("headline"),
          subheadline: form.get("subheadline"),
          buttonText: form.get("buttonText"),
        },
      }),
      "Portada guardada."
    );
  }

  async function saveTheme(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await themeAction.run(
      updateThemeAction({
        funnelId,
        theme: {
          logoUrl: form.get("logoUrl"),
          primaryColor: form.get("primaryColor"),
          backgroundColor: form.get("backgroundColor"),
          font: form.get("font"),
          buttonRadius: form.get("buttonRadius"),
        },
      }),
      "Diseño guardado."
    );
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Portada</CardTitle>
          <CardDescription>
            Lo primero que ve el visitante antes de empezar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveIntro} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="intro-headline">Titular</Label>
              <Input
                id="intro-headline"
                name="headline"
                defaultValue={intro.headline}
                maxLength={120}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="intro-subheadline">Subtítulo</Label>
              <Textarea
                id="intro-subheadline"
                name="subheadline"
                defaultValue={intro.subheadline}
                maxLength={220}
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="intro-button">Texto del botón</Label>
              <Input
                id="intro-button"
                name="buttonText"
                defaultValue={intro.buttonText}
                maxLength={40}
                required
                className="max-w-48"
              />
            </div>
            <div>
              <Button type="submit" disabled={introAction.pending}>
                {introAction.pending ? "Guardando…" : "Guardar portada"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Apariencia</CardTitle>
            <CardDescription>
              Colores, tipografía y logo de la experiencia pública.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={applyBrand}
            disabled={brandAction.pending}
          >
            {brandAction.pending ? "Aplicando…" : "Aplicar mi marca"}
          </Button>
        </CardHeader>
        <CardContent>
          <form
            key={`${theme.primaryColor}-${theme.logoUrl}-${theme.font}`}
            onSubmit={saveTheme}
            className="grid gap-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="theme-logo">Logo (URL de imagen)</Label>
              <Input
                id="theme-logo"
                name="logoUrl"
                type="url"
                defaultValue={theme.logoUrl}
                placeholder="https://tu-sitio.com/logo.png"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="theme-primary">Color principal</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="theme-primary"
                    name="primaryColor"
                    type="color"
                    defaultValue={theme.primaryColor}
                    className="h-9 w-14 cursor-pointer rounded border bg-transparent p-1"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="theme-background">Fondo</Label>
                <input
                  id="theme-background"
                  name="backgroundColor"
                  type="color"
                  defaultValue={theme.backgroundColor}
                  className="h-9 w-14 cursor-pointer rounded border bg-transparent p-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Tipografía</Label>
                <Select name="font" defaultValue={theme.font}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Botones</Label>
                <Select name="buttonRadius" defaultValue={theme.buttonRadius}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="md">Esquinas suaves</SelectItem>
                    <SelectItem value="full">Redondeados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Button type="submit" disabled={themeAction.pending}>
                {themeAction.pending ? "Guardando…" : "Guardar apariencia"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
