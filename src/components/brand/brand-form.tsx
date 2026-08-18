"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateBrandAction } from "@/app/(app)/brand/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FONT_OPTIONS } from "@/lib/funnel-config";

export interface BrandData {
  businessName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  font: string;
  website: string;
  whatsapp: string;
  email: string;
}

export function BrandForm({ brand }: { brand: BrandData }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState(brand.logoUrl);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    const result = await updateBrandAction(form);
    setSaving(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Marca actualizada.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8">
      <section className="grid gap-4">
        <h2 className="text-[15px] font-semibold text-ink">Identidad</h2>
        <div className="grid gap-2">
          <Label htmlFor="brand-name">Nombre del negocio</Label>
          <Input
            id="brand-name"
            name="businessName"
            defaultValue={brand.businessName}
            placeholder="Clínica Nova"
            maxLength={120}
          />
          <p className="text-xs text-muted-foreground">
            Aparece en la cabecera de tus funnels públicos.
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="brand-logo">
            Logo <span className="text-muted-foreground">(URL de imagen)</span>
          </Label>
          <div className="rounded-2xl border border-dashed border-line-soft p-4">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- logo definido por el usuario
                <img
                  src={logoUrl}
                  alt=""
                  className="h-10 w-auto max-w-24 object-contain"
                  onError={() => setLogoUrl("")}
                />
              ) : (
                <span className="flex h-10 w-16 items-center justify-center rounded-lg bg-surface text-[11px] text-ink-placeholder">
                  logo
                </span>
              )}
              <Input
                id="brand-logo"
                name="logoUrl"
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://tu-sitio.com/logo.png"
                className="border-none bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-[15px] font-semibold text-ink">
          Colores y tipografía
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="brand-primary">Color principal</Label>
            <div className="flex items-center gap-2">
              <input
                id="brand-primary"
                name="primaryColor"
                type="color"
                defaultValue={brand.primaryColor || "#1d3f52"}
                className="h-9 w-14 cursor-pointer rounded border bg-transparent p-1"
              />
              <span className="font-mono text-xs text-ink-secondary">
                {brand.primaryColor || "#1d3f52"}
              </span>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="brand-secondary">Color secundario</Label>
            <div className="flex items-center gap-2">
              <input
                id="brand-secondary"
                name="secondaryColor"
                type="color"
                defaultValue={brand.secondaryColor || "#7fa8c4"}
                className="h-9 w-14 cursor-pointer rounded border bg-transparent p-1"
              />
              <span className="font-mono text-xs text-ink-secondary">
                {brand.secondaryColor || "#7fa8c4"}
              </span>
            </div>
          </div>
        </div>
        <div className="grid gap-2">
          <Label>Tipografía</Label>
          <Select name="font" defaultValue={brand.font || "sans"}>
            <SelectTrigger className="max-w-64">
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
      </section>

      <section className="grid gap-4">
        <h2 className="text-[15px] font-semibold text-ink">Contacto</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="brand-website">Sitio web</Label>
            <Input
              id="brand-website"
              name="website"
              type="url"
              defaultValue={brand.website}
              placeholder="https://tunegocio.com"
              maxLength={300}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="brand-whatsapp">WhatsApp</Label>
            <Input
              id="brand-whatsapp"
              name="whatsapp"
              type="tel"
              defaultValue={brand.whatsapp}
              placeholder="+34 600 000 000"
              maxLength={30}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="brand-email">Email</Label>
            <Input
              id="brand-email"
              name="email"
              type="email"
              defaultValue={brand.email}
              placeholder="hola@tunegocio.com"
              maxLength={200}
            />
          </div>
        </div>
      </section>

      <div>
        <Button type="submit" disabled={saving}>
          {saving ? "Guardando…" : "Guardar marca"}
        </Button>
      </div>
    </form>
  );
}
