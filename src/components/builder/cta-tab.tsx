"use client";

import { useState } from "react";

import { updateCtaAction } from "@/app/(app)/funnels/[funnelId]/edit/actions";
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
import { CTA_TYPES, type CtaConfig } from "@/lib/funnel-config";

const VALUE_LABEL: Record<CtaConfig["type"], { label: string; placeholder: string }> = {
  whatsapp: {
    label: "Número de WhatsApp (con código de país)",
    placeholder: "+34 600 000 000",
  },
  url: { label: "URL de destino", placeholder: "https://tu-sitio.com" },
  booking: {
    label: "URL de tu sistema de reservas",
    placeholder: "https://calendly.com/tu-negocio",
  },
  purchase: {
    label: "URL de compra",
    placeholder: "https://tu-tienda.com/producto",
  },
  email: { label: "Email de contacto", placeholder: "hola@tunegocio.com" },
  phone: { label: "Número de teléfono", placeholder: "+34 900 000 000" },
};

export function CtaTab({
  funnelId,
  cta,
}: {
  funnelId: string;
  cta: CtaConfig;
}) {
  const { run, pending } = useBuilderAction();
  const [type, setType] = useState<CtaConfig["type"]>(cta.type);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await run(
      updateCtaAction({
        funnelId,
        cta: {
          type,
          label: form.get("label"),
          value: form.get("value"),
          whatsappMessage:
            form.get("whatsappMessage") ?? cta.whatsappMessage,
          resultNote: form.get("resultNote") ?? "",
        },
      }),
      "CTA guardado."
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Llamada a la acción</CardTitle>
        <CardDescription>
          La acción final que verá el visitante junto a su resultado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Tipo de acción</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as CtaConfig["type"])}
            >
              <SelectTrigger className="max-w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CTA_TYPES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="cta-label">Texto del botón</Label>
            <Input
              id="cta-label"
              name="label"
              defaultValue={cta.label}
              maxLength={60}
              required
              className="max-w-72"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="cta-value">{VALUE_LABEL[type].label}</Label>
            <Input
              id="cta-value"
              name="value"
              defaultValue={cta.value}
              placeholder={VALUE_LABEL[type].placeholder}
              maxLength={500}
            />
          </div>

          {type === "whatsapp" ? (
            <div className="grid gap-1.5">
              <Label htmlFor="cta-message">Mensaje precargado</Label>
              <Textarea
                id="cta-message"
                name="whatsappMessage"
                defaultValue={cta.whatsappMessage}
                maxLength={500}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Variables disponibles: {"{{funnel_name}}"} y {"{{result_name}}"}.
              </p>
            </div>
          ) : null}

          <div className="grid gap-1.5">
            <Label htmlFor="cta-note">
              Nota bajo el resultado{" "}
              <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="cta-note"
              name="resultNote"
              defaultValue={cta.resultNote}
              placeholder="Ej.: Este resultado es orientativo y no constituye un diagnóstico médico."
              maxLength={300}
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              Útil en salud y estética para dejar claro que el resultado es
              orientativo.
            </p>
          </div>

          <div>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Guardar CTA"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
