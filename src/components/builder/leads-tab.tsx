"use client";

import { useState } from "react";

import { updateLeadCaptureAction } from "@/app/(app)/funnels/[funnelId]/edit/actions";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { LeadCaptureConfig } from "@/lib/funnel-config";

export function LeadsTab({
  funnelId,
  leadCapture,
}: {
  funnelId: string;
  leadCapture: LeadCaptureConfig;
}) {
  const { run, pending } = useBuilderAction();
  const [fields, setFields] = useState(leadCapture.fields);
  const [consentEnabled, setConsentEnabled] = useState(
    leadCapture.consent.enabled
  );

  function setField(
    key: string,
    patch: Partial<{ enabled: boolean; required: boolean; label: string }>
  ) {
    setFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, ...patch } : f))
    );
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await run(
      updateLeadCaptureAction({
        funnelId,
        leadCapture: {
          position: form.get("position"),
          title: form.get("title"),
          fields,
          consent: {
            enabled: consentEnabled,
            text: form.get("consentText"),
          },
        },
      }),
      "Captura de leads guardada."
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Captura de leads</CardTitle>
        <CardDescription>
          Qué datos pides al visitante y en qué momento.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="lead-title">Título del formulario</Label>
            <Input
              id="lead-title"
              name="title"
              defaultValue={leadCapture.title}
              maxLength={120}
              required
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Campos</Label>
            <div className="grid gap-2">
              {fields.map((field) => (
                <div
                  key={field.key}
                  className="flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2"
                >
                  <Switch
                    checked={field.enabled}
                    onCheckedChange={(v) => setField(field.key, { enabled: v })}
                  />
                  <Input
                    value={field.label}
                    maxLength={40}
                    onChange={(e) =>
                      setField(field.key, { label: e.target.value })
                    }
                    className="w-40"
                  />
                  <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                    <Switch
                      checked={field.required}
                      disabled={!field.enabled}
                      onCheckedChange={(v) =>
                        setField(field.key, { required: v })
                      }
                    />
                    Obligatorio
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Cuándo aparece el formulario</Label>
            <Select name="position" defaultValue={leadCapture.position}>
              <SelectTrigger className="max-w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="before_result">
                  Antes de mostrar el resultado
                </SelectItem>
                <SelectItem value="after_result">
                  Después de mostrar el resultado
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Switch
                checked={consentEnabled}
                onCheckedChange={setConsentEnabled}
              />
              Checkbox de consentimiento
            </label>
            <Textarea
              name="consentText"
              defaultValue={leadCapture.consent.text}
              maxLength={300}
              rows={2}
              disabled={!consentEnabled}
            />
          </div>

          <div>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
