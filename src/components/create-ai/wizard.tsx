"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { generateFunnelAction } from "@/app/(app)/create-ai/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const GOAL_OPTIONS = [
  "Generar leads",
  "Vender",
  "Conseguir reservas",
  "Recomendar un producto",
  "Recomendar un servicio",
  "Diagnóstico orientativo",
  "Segmentar clientes",
  "Captar solicitudes",
  "Crear un quiz",
];

const ACTION_OPTIONS = [
  "WhatsApp",
  "Reservar",
  "Comprar",
  "Solicitar información",
  "Visitar página",
  "Llamada",
  "Email",
];

const GENERATION_STEPS = [
  "Analizando tu objetivo",
  "Diseñando las preguntas",
  "Creando la lógica de resultados",
  "Redactando los textos",
  "Preparando el CTA",
];

interface StepDef {
  key:
    | "businessType"
    | "goal"
    | "product"
    | "audience"
    | "finalAction"
    | "additionalInfo";
  name: string;
  title: string;
  hint?: string;
  kind: "text" | "options";
  options?: string[];
  placeholder?: string;
  rows?: number;
  optional?: boolean;
}

const STEPS: StepDef[] = [
  {
    key: "businessType",
    name: "Negocio",
    title: "¿Qué tipo de negocio tienes?",
    hint: "Ej.: una clínica estética especializada en tratamientos faciales",
    kind: "text",
    placeholder: "Describe tu negocio…",
    rows: 3,
  },
  {
    key: "goal",
    name: "Objetivo",
    title: "¿Qué quieres conseguir?",
    kind: "options",
    options: GOAL_OPTIONS,
  },
  {
    key: "product",
    name: "Oferta",
    title: "¿Qué producto o servicio quieres promocionar?",
    hint: "Ej.: tratamientos para flacidez facial con radiofrecuencia",
    kind: "text",
    placeholder: "Describe el producto o servicio…",
    rows: 3,
  },
  {
    key: "audience",
    name: "Audiencia",
    title: "¿Quién es tu público?",
    hint: "Ej.: mujeres de 35 a 60 años preocupadas por la firmeza de la piel",
    kind: "text",
    placeholder: "Describe a tu público…",
    rows: 4,
  },
  {
    key: "finalAction",
    name: "Acción final",
    title: "¿Cuál quieres que sea la acción final?",
    hint: "Lo que hará el visitante después de ver su resultado",
    kind: "options",
    options: ACTION_OPTIONS,
  },
  {
    key: "additionalInfo",
    name: "Contexto",
    title: "¿Algo más que deba saber la IA?",
    hint: "Opcional: tu número de WhatsApp, la URL de reservas, el tono de tu marca, tratamientos concretos…",
    kind: "text",
    placeholder: "Escribe aquí (opcional)…",
    rows: 5,
    optional: true,
  },
];

const REQUIRED_KEYS = [
  "businessType",
  "goal",
  "product",
  "audience",
  "finalAction",
] as const;

type Phase = "wizard" | "generating" | "ready" | "error";

export function CreateAiWizard() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<Phase>("wizard");
  const [errorMessage, setErrorMessage] = useState("");
  const [createdFunnelId, setCreatedFunnelId] = useState<string | null>(null);

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const value = answers[step.key] ?? "";
  const canContinue = step.optional || value.trim().length >= 3;
  const allAnswered = REQUIRED_KEYS.every(
    (key) => (answers[key] ?? "").trim().length >= 3
  );

  function setValue(next: string) {
    setAnswers((prev) => ({ ...prev, [step.key]: next }));
  }

  function selectOption(option: string) {
    setAnswers((prev) => ({ ...prev, [step.key]: option }));
    setTimeout(() => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1)), 160);
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
        setCreatedFunnelId(result.funnelId);
        setPhase("ready");
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
    return <GeneratingScreen />;
  }

  if (phase === "ready" && createdFunnelId) {
    return (
      <div className="mx-auto max-w-[720px] py-10 text-center">
        <span className="mx-auto flex size-24 items-center justify-center rounded-[26px] bg-brand">
          <svg
            width="34"
            height="34"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FCFBF9"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <h1 className="display mt-7 text-[32px] text-ink">
          Tu funnel está listo
        </h1>
        <p className="mx-auto mt-2 max-w-md text-[15px] text-ink-primary">
          Revisa las preguntas, ajusta lo que quieras y publícalo cuando estés
          conforme.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            onClick={() => router.push(`/funnels/${createdFunnelId}/edit`)}
          >
            Ver funnel
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/funnels">Volver a mis funnels</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="mx-auto max-w-[720px] py-10 text-center">
        <h1 className="display text-[26px] text-ink">
          No se pudo generar el funnel
        </h1>
        <p className="mx-auto mt-2 max-w-md text-[15px] text-ink-primary">
          {errorMessage}
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={generate}>Reintentar</Button>
          <Button variant="outline" onClick={() => setPhase("wizard")}>
            Revisar respuestas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[720px]">
      <div className="mb-7">
        <p className="micro-label">crear con ia</p>
        <h1 className="display mt-2 text-[36px] text-ink">
          Cuéntanos sobre tu negocio
        </h1>
        <p className="mt-2 text-[15px] text-ink-primary">
          Seis preguntas rápidas y la IA construye tu funnel completo.
        </p>
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between text-[12.5px] text-ink-secondary">
          <span>
            Paso {stepIndex + 1} de {STEPS.length}
          </span>
          <span>{step.name}</span>
        </div>
        <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-brand transition-brand"
            style={{
              width: `${((stepIndex + 1) / STEPS.length) * 100}%`,
              transitionDuration: "320ms",
              transitionProperty: "width",
            }}
          />
        </div>
      </div>

      <div className="min-h-[330px] rounded-2xl border border-line bg-card p-8">
        <h2 className="display text-[26px] text-ink">{step.title}</h2>
        {step.hint ? (
          <p className="mt-2 text-[14px] text-ink-primary">{step.hint}</p>
        ) : null}

        <div className="mt-6">
          {step.kind === "options" ? (
            <div className="grid gap-2.5 sm:grid-cols-3">
              {step.options!.map((option) => {
                const selected = value === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => selectOption(option)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-[14px] p-3.5 text-left text-[14px] transition-all transition-brand duration-150",
                      selected
                        ? "border-2 border-brand bg-surface font-medium"
                        : "border border-line hover:border-line-soft hover:bg-[#F7F6F3]"
                    )}
                  >
                    <span
                      className={cn(
                        "size-[9px] shrink-0 rounded-full",
                        selected ? "bg-brand" : "bg-line-soft"
                      )}
                    />
                    {option}
                  </button>
                );
              })}
            </div>
          ) : (
            <Textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={step.placeholder}
              rows={step.rows ?? 3}
              maxLength={step.key === "additionalInfo" ? 2000 : 400}
              autoFocus
              className="rounded-[12px] border-line-soft text-[15px]"
            />
          )}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          disabled={stepIndex === 0}
        >
          Atrás
        </Button>
        {isLast ? (
          <Button size="lg" onClick={generate} disabled={!allAnswered}>
            Generar funnel
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={() => setStepIndex((i) => i + 1)}
            disabled={!canContinue}
          >
            Continuar
          </Button>
        )}
      </div>
    </div>
  );
}

/** Pantalla de generación: tile óvalo petróleo + checklist de 5 pasos. */
function GeneratingScreen() {
  const [done, setDone] = useState(0);

  useEffect(() => {
    // El checklist avanza mientras la IA trabaja; el último paso queda
    // pendiente hasta que la generación real termina.
    const timer = setInterval(() => {
      setDone((d) => (d < GENERATION_STEPS.length - 1 ? d + 1 : d));
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mx-auto max-w-[720px] py-10 text-center">
      <span
        className="mx-auto flex size-24 items-center justify-center rounded-[26px] bg-brand"
        aria-hidden
      >
        <span
          className="size-9 animate-pulse bg-[#FCFBF9]"
          style={{ borderRadius: "50% 50% 50% 50% / 42% 42% 58% 58%" }}
        />
      </span>
      <h1 className="display mt-7 text-[32px] text-ink">
        Creando tu funnel
      </h1>
      <p className="mx-auto mt-2 max-w-md text-[15px] text-ink-primary">
        Suele tardar menos de un minuto. No cierres esta pestaña.
      </p>

      <ul className="mx-auto mt-8 grid max-w-sm gap-3 text-left">
        {GENERATION_STEPS.map((label, i) => {
          const complete = i < done;
          return (
            <li key={label} className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full transition-colors transition-brand",
                  complete ? "bg-brand" : "border border-line bg-transparent"
                )}
              >
                {complete ? (
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#FCFBF9"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : null}
              </span>
              <span
                className={cn(
                  "text-[14.5px]",
                  complete ? "text-ink" : "text-ink-secondary"
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
