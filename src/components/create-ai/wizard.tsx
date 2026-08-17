"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, RotateCcw, Sparkles } from "lucide-react";

import { generateFunnelAction } from "@/app/(app)/create-ai/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const GOAL_OPTIONS = [
  "Generar leads",
  "Vender",
  "Conseguir reservas",
  "Recomendar un producto",
  "Recomendar un servicio",
  "Realizar un diagnóstico orientativo",
  "Segmentar clientes",
  "Captar solicitudes",
  "Crear un quiz",
  "Otro",
];

const ACTION_OPTIONS = [
  "WhatsApp",
  "Reservar",
  "Comprar",
  "Solicitar información",
  "Visitar página",
  "Llamada",
  "Email",
  "CTA personalizado",
];

interface StepDef {
  key: "businessType" | "goal" | "product" | "audience" | "finalAction" | "additionalInfo";
  title: string;
  hint?: string;
  kind: "text" | "options";
  options?: string[];
  placeholder?: string;
  optional?: boolean;
}

const STEPS: StepDef[] = [
  {
    key: "businessType",
    title: "¿Qué tipo de negocio tienes?",
    hint: "Ej.: una clínica estética especializada en tratamientos faciales",
    kind: "text",
    placeholder: "Describe tu negocio…",
  },
  {
    key: "goal",
    title: "¿Qué quieres conseguir?",
    kind: "options",
    options: GOAL_OPTIONS,
  },
  {
    key: "product",
    title: "¿Qué producto o servicio quieres promocionar?",
    hint: "Ej.: tratamientos para flacidez facial con radiofrecuencia",
    kind: "text",
    placeholder: "Describe el producto o servicio…",
  },
  {
    key: "audience",
    title: "¿Quién es tu público?",
    hint: "Ej.: mujeres de 35 a 60 años preocupadas por el envejecimiento de la piel",
    kind: "text",
    placeholder: "Describe a tu público…",
  },
  {
    key: "finalAction",
    title: "¿Cuál quieres que sea la acción final?",
    hint: "Lo que hará el visitante después de ver su resultado",
    kind: "options",
    options: ACTION_OPTIONS,
  },
  {
    key: "additionalInfo",
    title: "Cuéntame cualquier información adicional que debería conocer la IA",
    hint: "Opcional: tu número de WhatsApp, la URL de reservas, el tono de tu marca, tratamientos concretos…",
    kind: "text",
    placeholder: "Escribe aquí (opcional)…",
    optional: true,
  },
];

type Phase = "wizard" | "generating" | "error";

export function CreateAiWizard() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<Phase>("wizard");
  const [errorMessage, setErrorMessage] = useState("");

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const value = answers[step.key] ?? "";
  const canContinue = step.optional || value.trim().length >= 3;

  function setValue(next: string) {
    setAnswers((prev) => ({ ...prev, [step.key]: next }));
  }

  function goNext() {
    if (!isLast) {
      setStepIndex((i) => i + 1);
    }
  }

  function selectOption(option: string) {
    setValue(option);
    // Auto-avanza tras elegir, como en un funnel de verdad.
    setTimeout(() => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1)), 150);
  }

  async function generate() {
    setPhase("generating");
    try {
      const result = await generateFunnelAction({
        businessType: answers.businessType,
        goal: answers.goal,
        product: answers.product,
        audience: answers.audience,
        finalAction: answers.finalAction,
        additionalInfo: answers.additionalInfo || undefined,
      });
      if (result && "funnelId" in result && result.funnelId) {
        router.push(`/funnels/${result.funnelId}/edit`);
        return;
      }
      setErrorMessage(result?.error ?? "No se pudo generar el funnel.");
      setPhase("error");
    } catch {
      setErrorMessage(
        "Se perdió la conexión durante la generación. Inténtalo de nuevo."
      );
      setPhase("error");
    }
  }

  if (phase === "generating") {
    return (
      <Card className="mx-auto w-full max-w-xl">
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <span className="flex size-14 animate-pulse items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="size-7 text-primary" />
          </span>
          <div>
            <p className="text-lg font-semibold">La IA está creando tu funnel…</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Preguntas, lógica, perfiles de resultado y textos. Suele tardar
              menos de un minuto.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (phase === "error") {
    return (
      <Card className="mx-auto w-full max-w-xl">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-lg font-semibold">No se pudo generar el funnel</p>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            {errorMessage}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPhase("wizard")}>
              Revisar respuestas
            </Button>
            <Button onClick={generate}>
              <RotateCcw className="size-4" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardContent className="grid gap-6 py-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Paso {stepIndex + 1} de {STEPS.length}
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        <div>
          <h2 className="text-balance text-xl font-semibold leading-snug">
            {step.title}
          </h2>
          {step.hint ? (
            <p className="mt-1 text-sm text-muted-foreground">{step.hint}</p>
          ) : null}
        </div>

        {step.kind === "options" ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {step.options!.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => selectOption(option)}
                className={cn(
                  "rounded-lg border p-3 text-left text-sm font-medium transition-colors hover:border-primary/60",
                  value === option
                    ? "border-primary bg-primary/5"
                    : "border-border"
                )}
              >
                {option}
              </button>
            ))}
          </div>
        ) : (
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={step.placeholder}
            rows={4}
            maxLength={step.key === "additionalInfo" ? 2000 : 400}
            autoFocus
          />
        )}

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            disabled={stepIndex === 0}
          >
            <ArrowLeft className="size-4" />
            Atrás
          </Button>
          {isLast ? (
            <Button onClick={generate} disabled={!canContinueAll(answers)}>
              <Sparkles className="size-4" />
              Generar mi Funnel ✨
            </Button>
          ) : (
            <Button onClick={goNext} disabled={!canContinue}>
              Continuar
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function canContinueAll(answers: Record<string, string>): boolean {
  return ["businessType", "goal", "product", "audience", "finalAction"].every(
    (key) => (answers[key] ?? "").trim().length >= 3
  );
}
