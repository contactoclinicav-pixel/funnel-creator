"use client";

import { useMemo, useState } from "react";

import {
  buildWhatsappUrl,
  type CtaConfig,
  type FunnelSnapshot,
  type SnapshotProfile,
  type SnapshotQuestion,
} from "@/lib/funnel-config";
import {
  computeResult,
  nextQuestionIndex,
  orderedQuestions,
  type AnswerMap,
  type AnswerValue,
} from "@/lib/result-engine";
import { cn } from "@/lib/utils";

export interface LeadData {
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  consent: boolean;
}

export interface FunnelExperienceCallbacks {
  onStart?: () => void;
  onAnswer?: (questionId: string, value: AnswerValue) => void;
  onComplete?: (answers: AnswerMap) => void;
  onLead?: (lead: LeadData) => void;
  onResultView?: (profile: SnapshotProfile | null) => void;
  onCtaClick?: (cta: CtaConfig) => void;
}

type Screen =
  | { kind: "intro" }
  | { kind: "question"; index: number }
  | { kind: "lead" }
  | { kind: "result" }
  | { kind: "thanks" };

const FONT_CLASS: Record<string, string> = {
  sans: "font-sans",
  serif: "font-serif",
  mono: "font-mono",
};

/**
 * Experiencia interactiva completa del funnel a partir de un snapshot.
 * La usa el preview del builder y la usará el runner público (Fase 4)
 * pasando callbacks reales de tracking/persistencia.
 */
export function FunnelExperience({
  snapshot,
  callbacks = {},
  className,
}: {
  snapshot: FunnelSnapshot;
  callbacks?: FunnelExperienceCallbacks;
  className?: string;
}) {
  const questions = useMemo(() => orderedQuestions(snapshot), [snapshot]);
  const [screen, setScreen] = useState<Screen>({ kind: "intro" });
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [answeredCount, setAnsweredCount] = useState(0);
  const [lead, setLead] = useState<LeadData | null>(null);

  const theme = snapshot.theme;
  const leadBefore = snapshot.leadCapture.position === "before_result";
  const buttonRadius = theme.buttonRadius === "full" ? "9999px" : "0.5rem";

  const result = useMemo(
    () => computeResult(snapshot, answers),
    [snapshot, answers]
  );

  const activeCta: CtaConfig =
    (screen.kind === "result" || screen.kind === "thanks") &&
    result.profile?.ctaOverride
      ? result.profile.ctaOverride
      : snapshot.cta;

  function ctaHref(cta: CtaConfig): string {
    if (!cta.value) return "#";
    switch (cta.type) {
      case "whatsapp":
        return buildWhatsappUrl(cta.value, cta.whatsappMessage, {
          funnel_name: snapshot.name,
          result_name: result.profile?.title ?? "mi resultado",
        });
      case "email":
        return `mailto:${cta.value}`;
      case "phone":
        return `tel:${cta.value}`;
      default:
        return cta.value;
    }
  }

  function goToQuestion(index: number) {
    setScreen({ kind: "question", index });
  }

  function finishQuestions(finalAnswers: AnswerMap) {
    callbacks.onComplete?.(finalAnswers);
    if (leadBefore && hasLeadForm(snapshot)) {
      setScreen({ kind: "lead" });
    } else {
      callbacks.onResultView?.(computeResult(snapshot, finalAnswers).profile);
      setScreen({ kind: "result" });
    }
  }

  function submitAnswer(question: SnapshotQuestion, value: AnswerValue) {
    const nextAnswers = { ...answers, [question.id]: value };
    setAnswers(nextAnswers);
    setAnsweredCount((c) => c + 1);
    callbacks.onAnswer?.(question.id, value);

    if (screen.kind !== "question") return;
    const next = nextQuestionIndex(snapshot, screen.index, nextAnswers);
    if (next === null) {
      finishQuestions(nextAnswers);
    } else {
      goToQuestion(next);
    }
  }

  function skipQuestion() {
    if (screen.kind !== "question") return;
    const next = nextQuestionIndex(snapshot, screen.index, answers);
    if (next === null) {
      finishQuestions(answers);
    } else {
      goToQuestion(next);
    }
  }

  function submitLead(data: LeadData) {
    setLead(data);
    callbacks.onLead?.(data);
    if (leadBefore) {
      callbacks.onResultView?.(result.profile);
      setScreen({ kind: "result" });
    } else {
      setScreen({ kind: "thanks" });
    }
  }

  const progress =
    questions.length === 0
      ? 0
      : Math.min(100, Math.round((answeredCount / questions.length) * 100));

  return (
    <div
      className={cn(
        "flex min-h-full w-full flex-col",
        FONT_CLASS[theme.font] ?? "font-sans",
        className
      )}
      style={
        {
          backgroundColor: theme.backgroundColor,
          color: readableText(theme.backgroundColor),
          "--funnel-primary": theme.primaryColor,
          "--funnel-radius": buttonRadius,
        } as React.CSSProperties
      }
    >
      {screen.kind === "question" && questions.length > 0 ? (
        <div className="px-6 pt-5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: theme.primaryColor }}
            />
          </div>
          <p className="mt-1.5 text-xs opacity-60">{progress}% completado</p>
        </div>
      ) : null}

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
        {screen.kind === "intro" ? (
          <IntroScreen
            snapshot={snapshot}
            onStart={() => {
              callbacks.onStart?.();
              if (questions.length > 0) {
                goToQuestion(0);
              } else {
                finishQuestions({});
              }
            }}
          />
        ) : null}

        {screen.kind === "question" && questions[screen.index] ? (
          <QuestionScreen
            key={questions[screen.index].id}
            question={questions[screen.index]}
            position={screen.index + 1}
            total={questions.length}
            onSubmit={(value) => submitAnswer(questions[screen.index], value)}
            onSkip={skipQuestion}
          />
        ) : null}

        {screen.kind === "lead" ? (
          <LeadScreen snapshot={snapshot} onSubmit={submitLead} />
        ) : null}

        {screen.kind === "result" ? (
          <ResultScreen
            snapshot={snapshot}
            profile={result.profile}
            cta={activeCta}
            ctaHref={ctaHref(activeCta)}
            onCtaClick={() => callbacks.onCtaClick?.(activeCta)}
            needsLeadAfter={!leadBefore && hasLeadForm(snapshot) && !lead}
            onContinueToLead={() => setScreen({ kind: "lead" })}
          />
        ) : null}

        {screen.kind === "thanks" ? (
          <div className="w-full max-w-md text-center">
            <h2 className="text-2xl font-semibold">¡Gracias!</h2>
            <p className="mt-2 opacity-70">
              Hemos recibido tus datos. Este es tu siguiente paso:
            </p>
            <CtaButton
              cta={activeCta}
              href={ctaHref(activeCta)}
              onClick={() => callbacks.onCtaClick?.(activeCta)}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function hasLeadForm(snapshot: FunnelSnapshot): boolean {
  return snapshot.leadCapture.fields.some((f) => f.enabled);
}

function readableText(background: string): string {
  const hex = background.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#171717" : "#fafafa";
}

// ── Pantallas ─────────────────────────────────────────────

function IntroScreen({
  snapshot,
  onStart,
}: {
  snapshot: FunnelSnapshot;
  onStart: () => void;
}) {
  const { intro, theme } = snapshot;
  return (
    <div className="w-full max-w-md text-center">
      {theme.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- logo externo definido por el usuario
        <img
          src={theme.logoUrl}
          alt=""
          className="mx-auto mb-6 h-12 w-auto object-contain"
        />
      ) : null}
      <h1 className="text-balance text-3xl font-semibold leading-tight">
        {intro.headline}
      </h1>
      {intro.subheadline ? (
        <p className="mt-3 text-balance opacity-70">{intro.subheadline}</p>
      ) : null}
      <PrimaryButton onClick={onStart} className="mt-8">
        {intro.buttonText}
      </PrimaryButton>
    </div>
  );
}

function QuestionScreen({
  question,
  position,
  total,
  onSubmit,
  onSkip,
}: {
  question: SnapshotQuestion;
  position: number;
  total: number;
  onSubmit: (value: AnswerValue) => void;
  onSkip: () => void;
}) {
  const [multiValue, setMultiValue] = useState<string[]>([]);
  const [textValue, setTextValue] = useState("");

  const settings = question.settings ?? {};
  const scaleMin = settings.scaleMin ?? 1;
  const scaleMax = settings.scaleMax ?? 5;

  const inputType =
    question.type === "EMAIL"
      ? "email"
      : question.type === "PHONE"
        ? "tel"
        : question.type === "NUMBER"
          ? "number"
          : "text";

  function submitTextual() {
    if (question.required && textValue.trim().length === 0) return;
    onSubmit(
      question.type === "NUMBER" ? Number(textValue) : textValue.trim()
    );
  }

  return (
    <div className="w-full max-w-md">
      <p className="text-xs font-medium uppercase tracking-wide opacity-50">
        Pregunta {position} / {total}
      </p>
      <h2 className="mt-2 text-balance text-2xl font-semibold leading-snug">
        {question.title}
      </h2>
      {question.description ? (
        <p className="mt-2 text-sm opacity-70">{question.description}</p>
      ) : null}

      <div className="mt-6 grid gap-2.5">
        {(question.type === "SINGLE_CHOICE" || question.type === "YES_NO") &&
          question.options.map((option) => (
            <OptionButton
              key={option.id}
              label={option.label}
              selected={false}
              onClick={() => onSubmit([option.id])}
            />
          ))}

        {question.type === "MULTI_CHOICE" ? (
          <>
            {question.options.map((option) => {
              const selected = multiValue.includes(option.id);
              return (
                <OptionButton
                  key={option.id}
                  label={option.label}
                  selected={selected}
                  onClick={() =>
                    setMultiValue((prev) =>
                      selected
                        ? prev.filter((id) => id !== option.id)
                        : [...prev, option.id]
                    )
                  }
                />
              );
            })}
            <PrimaryButton
              className="mt-3"
              disabled={question.required && multiValue.length === 0}
              onClick={() => onSubmit(multiValue)}
            >
              Continuar
            </PrimaryButton>
          </>
        ) : null}

        {question.type === "SCALE" ? (
          <div>
            <div className="flex justify-center gap-2">
              {Array.from(
                { length: Math.max(0, scaleMax - scaleMin + 1) },
                (_, i) => scaleMin + i
              ).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onSubmit(n)}
                  className="flex size-11 items-center justify-center border text-sm font-semibold transition-transform hover:scale-105"
                  style={{
                    borderRadius: "var(--funnel-radius)",
                    borderColor: "var(--funnel-primary)",
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            {settings.scaleMinLabel || settings.scaleMaxLabel ? (
              <div className="mt-2 flex justify-between text-xs opacity-60">
                <span>{settings.scaleMinLabel}</span>
                <span>{settings.scaleMaxLabel}</span>
              </div>
            ) : null}
          </div>
        ) : null}

        {(question.type === "TEXT" ||
          question.type === "NUMBER" ||
          question.type === "EMAIL" ||
          question.type === "PHONE") && (
          <>
            {question.type === "TEXT" ? (
              <textarea
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                placeholder={settings.placeholder || "Escribe aquí…"}
                rows={3}
                className="w-full border bg-white/60 p-3 text-sm text-neutral-900 outline-none focus:ring-2"
                style={{ borderRadius: "var(--funnel-radius)" }}
              />
            ) : (
              <input
                type={inputType}
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                placeholder={settings.placeholder || "Escribe aquí…"}
                className="w-full border bg-white/60 p-3 text-sm text-neutral-900 outline-none focus:ring-2"
                style={{ borderRadius: "var(--funnel-radius)" }}
              />
            )}
            <PrimaryButton
              className="mt-3"
              disabled={question.required && textValue.trim().length === 0}
              onClick={submitTextual}
            >
              Continuar
            </PrimaryButton>
          </>
        )}

        {!question.required ? (
          <button
            type="button"
            onClick={onSkip}
            className="mt-1 text-sm underline-offset-4 opacity-60 hover:underline"
          >
            Omitir
          </button>
        ) : null}
      </div>
    </div>
  );
}

function LeadScreen({
  snapshot,
  onSubmit,
}: {
  snapshot: FunnelSnapshot;
  onSubmit: (lead: LeadData) => void;
}) {
  const config = snapshot.leadCapture;
  const fields = config.fields.filter((f) => f.enabled);
  const [values, setValues] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);

  const valid =
    fields.every(
      (f) => !f.required || (values[f.key] ?? "").trim().length > 0
    ) &&
    (!config.consent.enabled || consent);

  return (
    <div className="w-full max-w-md">
      <h2 className="text-balance text-2xl font-semibold">{config.title}</h2>
      <div className="mt-6 grid gap-3">
        {fields.map((field) => (
          <div key={field.key} className="grid gap-1">
            <label className="text-sm font-medium">
              {field.label}
              {field.required ? " *" : ""}
            </label>
            <input
              type={
                field.key === "email"
                  ? "email"
                  : field.key === "phone"
                    ? "tel"
                    : "text"
              }
              value={values[field.key] ?? ""}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
              }
              className="w-full border bg-white/60 p-3 text-sm text-neutral-900 outline-none focus:ring-2"
              style={{ borderRadius: "var(--funnel-radius)" }}
            />
          </div>
        ))}
        {config.consent.enabled ? (
          <label className="flex items-start gap-2 text-sm opacity-80">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5"
            />
            {config.consent.text}
          </label>
        ) : null}
        <PrimaryButton
          className="mt-2"
          disabled={!valid}
          onClick={() =>
            onSubmit({
              name: values.name,
              email: values.email,
              phone: values.phone,
              city: values.city,
              consent,
            })
          }
        >
          Ver mi resultado
        </PrimaryButton>
      </div>
    </div>
  );
}

function ResultScreen({
  snapshot,
  profile,
  cta,
  ctaHref,
  onCtaClick,
  needsLeadAfter,
  onContinueToLead,
}: {
  snapshot: FunnelSnapshot;
  profile: SnapshotProfile | null;
  cta: CtaConfig;
  ctaHref: string;
  onCtaClick: () => void;
  needsLeadAfter: boolean;
  onContinueToLead: () => void;
}) {
  return (
    <div className="w-full max-w-md text-center">
      <p className="text-xs font-medium uppercase tracking-wide opacity-50">
        Tu resultado
      </p>
      {profile ? (
        <>
          {profile.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- imagen definida por el usuario
            <img
              src={profile.imageUrl}
              alt=""
              className="mx-auto mt-4 max-h-40 w-auto rounded-lg object-cover"
            />
          ) : null}
          <h2 className="mt-3 text-balance text-3xl font-semibold">
            {profile.title}
          </h2>
          {profile.description ? (
            <p className="mt-3 opacity-75">{profile.description}</p>
          ) : null}
          {profile.recommendation ? (
            <div
              className="mt-4 border p-4 text-left text-sm"
              style={{
                borderRadius: "var(--funnel-radius)",
                borderColor: "var(--funnel-primary)",
              }}
            >
              <p className="font-medium">Nuestra recomendación</p>
              <p className="mt-1 opacity-80">{profile.recommendation}</p>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <h2 className="mt-3 text-balance text-3xl font-semibold">
            ¡Listo! Hemos registrado tus respuestas.
          </h2>
          <p className="mt-3 opacity-75">
            {snapshot.profiles.length === 0
              ? "Configura perfiles de resultado para mostrar aquí una recomendación personalizada."
              : ""}
          </p>
        </>
      )}

      {needsLeadAfter ? (
        <PrimaryButton className="mt-8" onClick={onContinueToLead}>
          Continuar
        </PrimaryButton>
      ) : (
        <CtaButton cta={cta} href={ctaHref} onClick={onCtaClick} />
      )}
    </div>
  );
}

// ── Piezas ────────────────────────────────────────────────

function PrimaryButton({
  children,
  onClick,
  disabled,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex min-h-11 w-full items-center justify-center px-6 text-sm font-semibold text-white transition-opacity disabled:opacity-40",
        className
      )}
      style={{
        backgroundColor: "var(--funnel-primary)",
        borderRadius: "var(--funnel-radius)",
      }}
    >
      {children}
    </button>
  );
}

function OptionButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full border p-3.5 text-left text-sm font-medium transition-colors",
        selected && "text-white"
      )}
      style={{
        borderRadius: "var(--funnel-radius)",
        borderColor: "var(--funnel-primary)",
        backgroundColor: selected ? "var(--funnel-primary)" : "transparent",
      }}
    >
      {label}
    </button>
  );
}

function CtaButton({
  cta,
  href,
  onClick,
}: {
  cta: CtaConfig;
  href: string;
  onClick: () => void;
}) {
  if (!cta.value) {
    return (
      <p className="mt-8 text-xs opacity-50">
        Configura el CTA para mostrar aquí el botón de acción.
      </p>
    );
  }
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noopener noreferrer"
      onClick={onClick}
      className="mt-8 inline-flex min-h-11 w-full max-w-md items-center justify-center px-6 text-sm font-semibold text-white"
      style={{
        backgroundColor: "var(--funnel-primary)",
        borderRadius: "var(--funnel-radius)",
      }}
    >
      {cta.label}
    </a>
  );
}
