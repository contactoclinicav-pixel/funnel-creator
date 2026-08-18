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
 * Experiencia del visitante. La estructura, tipografía y espaciados siguen el
 * design handoff; los colores vienen del tema del funnel (superficie
 * white-label del negocio, no de la marca aifunnel).
 */
export function FunnelExperience({
  snapshot,
  callbacks = {},
  className,
  businessName,
}: {
  snapshot: FunnelSnapshot;
  callbacks?: FunnelExperienceCallbacks;
  className?: string;
  businessName?: string;
}) {
  const questions = useMemo(() => orderedQuestions(snapshot), [snapshot]);
  const [screen, setScreen] = useState<Screen>({ kind: "intro" });
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [answeredCount, setAnsweredCount] = useState(0);
  const [lead, setLead] = useState<LeadData | null>(null);

  const theme = snapshot.theme;
  const leadBefore = snapshot.leadCapture.position === "before_result";
  const buttonRadius = theme.buttonRadius === "full" ? "9999px" : "12px";

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
    if (next === null) finishQuestions(nextAnswers);
    else setScreen({ kind: "question", index: next });
  }

  function skipQuestion() {
    if (screen.kind !== "question") return;
    const next = nextQuestionIndex(snapshot, screen.index, answers);
    if (next === null) finishQuestions(answers);
    else setScreen({ kind: "question", index: next });
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

  const ink = readableText(theme.backgroundColor);
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
          color: ink,
          "--funnel-primary": theme.primaryColor,
          "--funnel-radius": buttonRadius,
          "--funnel-ink-soft": `color-mix(in srgb, ${ink} 62%, transparent)`,
          "--funnel-line": `color-mix(in srgb, ${ink} 14%, transparent)`,
        } as React.CSSProperties
      }
    >
      {/* Header 56px con el nombre del negocio */}
      {businessName || theme.logoUrl ? (
        <header
          className="flex h-14 shrink-0 items-center px-5 md:px-8"
          style={{ borderBottom: "1px solid var(--funnel-line)" }}
        >
          {theme.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- logo definido por el usuario
            <img
              src={theme.logoUrl}
              alt={businessName ?? ""}
              className="h-7 w-auto object-contain"
            />
          ) : (
            <span className="text-[15px] font-semibold">{businessName}</span>
          )}
        </header>
      ) : null}

      {screen.kind === "question" && questions.length > 0 ? (
        <div className="px-5 pt-5 md:px-8">
          <div className="mx-auto w-full max-w-[640px]">
            <div
              className="h-[2px] w-full overflow-hidden rounded-full"
              style={{ backgroundColor: "var(--funnel-line)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  backgroundColor: theme.primaryColor,
                }}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-1 flex-col justify-center px-5 py-8 md:px-8 md:py-12">
        {screen.kind === "intro" ? (
          <IntroScreen
            snapshot={snapshot}
            questionCount={questions.length}
            onStart={() => {
              callbacks.onStart?.();
              if (questions.length > 0) setScreen({ kind: "question", index: 0 });
              else finishQuestions({});
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
          <div className="mx-auto w-full max-w-[560px] text-center">
            <p className="micro-label" style={{ color: "var(--funnel-ink-soft)" }}>
              gracias
            </p>
            <h2 className="display mt-3 text-[32px]">Hemos recibido tus datos</h2>
            <p className="mt-3 text-[15px]" style={{ color: "var(--funnel-ink-soft)" }}>
              Este es tu siguiente paso.
            </p>
            <CtaButton
              cta={activeCta}
              href={ctaHref(activeCta)}
              onClick={() => callbacks.onCtaClick?.(activeCta)}
            />
          </div>
        ) : null}
      </div>

      <footer className="px-5 pb-6 text-center md:px-8">
        <span className="text-[12px]" style={{ color: "var(--funnel-ink-soft)" }}>
          Powered by{" "}
          <span className="font-display font-bold lowercase tracking-[-0.05em]">
            aifunnel
          </span>
        </span>
      </footer>
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
  return luminance > 0.55 ? "#403C38" : "#FCFBF9";
}

/** Placeholder de fotografía con la dirección de arte del handoff. */
function PhotoPlaceholder({
  label,
  ratio,
  className,
}: {
  label: string;
  ratio: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-2xl",
        className
      )}
      style={{
        background:
          "repeating-linear-gradient(112deg,#E5E3DF 0 12px,#EDEBE7 12px 24px)",
        aspectRatio: ratio,
      }}
    >
      <span className="micro-label text-[#85817B]">{label}</span>
    </div>
  );
}

function IntroScreen({
  snapshot,
  questionCount,
  onStart,
}: {
  snapshot: FunnelSnapshot;
  questionCount: number;
  onStart: () => void;
}) {
  const { intro } = snapshot;
  return (
    <div className="mx-auto grid w-full max-w-[1040px] items-center gap-10 md:grid-cols-2">
      <div>
        <p className="micro-label" style={{ color: "var(--funnel-ink-soft)" }}>
          {snapshot.industry || "descúbrelo en 2 minutos"}
        </p>
        <h1 className="display mt-4 text-balance text-[32px] leading-[1.08] md:text-[52px]">
          {intro.headline}
        </h1>
        {intro.subheadline ? (
          <p
            className="mt-4 text-balance text-[16px] leading-[1.5]"
            style={{ color: "var(--funnel-ink-soft)" }}
          >
            {intro.subheadline}
          </p>
        ) : null}
        <PrimaryButton onClick={onStart} className="mt-8 h-14 md:max-w-[280px]">
          {intro.buttonText}
        </PrimaryButton>
        <p className="mt-3 text-[13px]" style={{ color: "var(--funnel-ink-soft)" }}>
          {questionCount} preguntas · menos de 3 minutos
        </p>
      </div>
      <PhotoPlaceholder
        label="[PHOTO-HERO] · 4:5"
        ratio="4 / 5"
        className="hidden max-h-[440px] md:flex"
      />
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
    onSubmit(question.type === "NUMBER" ? Number(textValue) : textValue.trim());
  }

  return (
    <div className="mx-auto w-full max-w-[640px]">
      <p className="text-[13px]" style={{ color: "var(--funnel-ink-soft)" }}>
        Pregunta {position} de {total}
      </p>
      <h2 className="display mt-3 text-balance text-[27px] leading-[1.15] md:text-[36px]">
        {question.title}
      </h2>
      {question.description ? (
        <p className="mt-2.5 text-[15px]" style={{ color: "var(--funnel-ink-soft)" }}>
          {question.description}
        </p>
      ) : null}

      <div className="mt-7 grid gap-2.5">
        {(question.type === "SINGLE_CHOICE" || question.type === "YES_NO") &&
          question.options.map((option) => (
            <OptionRow
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
                <OptionRow
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
              className="mt-4"
              disabled={question.required && multiValue.length === 0}
              onClick={() => onSubmit(multiValue)}
            >
              Continuar
            </PrimaryButton>
          </>
        ) : null}

        {question.type === "SCALE" ? (
          <div>
            <div className="flex flex-wrap justify-center gap-2.5">
              {Array.from(
                { length: Math.max(0, scaleMax - scaleMin + 1) },
                (_, i) => scaleMin + i
              ).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onSubmit(n)}
                  className="flex size-12 items-center justify-center text-[15px] font-semibold transition-all duration-150 hover:opacity-80"
                  style={{
                    borderRadius: "var(--funnel-radius)",
                    border: "1px solid var(--funnel-line)",
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            {settings.scaleMinLabel || settings.scaleMaxLabel ? (
              <div
                className="mt-3 flex justify-between text-[12.5px]"
                style={{ color: "var(--funnel-ink-soft)" }}
              >
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
                className="w-full bg-white/70 p-4 text-[15px] text-[#403C38] outline-none focus:ring-2"
                style={{
                  borderRadius: "var(--funnel-radius)",
                  border: "1px solid var(--funnel-line)",
                }}
              />
            ) : (
              <input
                type={inputType}
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                placeholder={settings.placeholder || "Escribe aquí…"}
                className="w-full bg-white/70 p-4 text-[15px] text-[#403C38] outline-none focus:ring-2"
                style={{
                  borderRadius: "var(--funnel-radius)",
                  border: "1px solid var(--funnel-line)",
                }}
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
            className="mt-1 text-[14px] underline-offset-4 hover:underline"
            style={{ color: "var(--funnel-ink-soft)" }}
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
    fields.every((f) => !f.required || (values[f.key] ?? "").trim().length > 0) &&
    (!config.consent.enabled || consent);

  return (
    <div className="mx-auto w-full max-w-[560px]">
      <h2 className="display text-balance text-[27px] leading-[1.15] md:text-[32px]">
        {config.title}
      </h2>
      <div className="mt-7 grid gap-3.5">
        {fields.map((field) => (
          <div key={field.key} className="grid gap-1.5">
            <label className="text-[13.5px] font-medium">
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
              className="w-full bg-white/70 p-3.5 text-[15px] text-[#403C38] outline-none focus:ring-2"
              style={{
                borderRadius: "var(--funnel-radius)",
                border: "1px solid var(--funnel-line)",
              }}
            />
          </div>
        ))}
        {config.consent.enabled ? (
          <label
            className="flex items-start gap-2.5 text-[13px]"
            style={{ color: "var(--funnel-ink-soft)" }}
          >
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
          className="mt-2 h-14"
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
    <div className="mx-auto w-full max-w-[640px]">
      {profile?.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- imagen definida por el usuario
        <img
          src={profile.imageUrl}
          alt=""
          className="mb-7 max-h-[240px] w-full rounded-2xl object-cover"
        />
      ) : (
        <PhotoPlaceholder
          label="[PHOTO-RESULT] · 16:9"
          ratio="16 / 9"
          className="mb-7 max-h-[240px]"
        />
      )}

      <p className="micro-label" style={{ color: "var(--funnel-ink-soft)" }}>
        tu resultado
      </p>

      {profile ? (
        <>
          <h2 className="display mt-3 text-balance text-[30px] leading-[1.1] md:text-[40px]">
            {profile.title}
          </h2>
          {profile.description ? (
            <p
              className="mt-4 text-[15.5px] leading-[1.5]"
              style={{ color: "var(--funnel-ink-soft)" }}
            >
              {profile.description}
            </p>
          ) : null}
          {profile.recommendation ? (
            <div
              className="mt-6 p-5"
              style={{
                borderRadius: "14px",
                border: "1px solid var(--funnel-line)",
              }}
            >
              <p className="micro-label" style={{ color: "var(--funnel-ink-soft)" }}>
                recomendación
              </p>
              <p className="mt-2 text-[15px] leading-[1.5]">
                {profile.recommendation}
              </p>
            </div>
          ) : null}
        </>
      ) : (
        <h2 className="display mt-3 text-balance text-[30px] leading-[1.1] md:text-[40px]">
          Hemos registrado tus respuestas
        </h2>
      )}

      {needsLeadAfter ? (
        <PrimaryButton className="mt-8 h-14" onClick={onContinueToLead}>
          Continuar
        </PrimaryButton>
      ) : (
        <CtaButton cta={cta} href={ctaHref} onClick={onCtaClick} />
      )}

      {snapshot.cta.resultNote ? (
        <p
          className="mt-5 text-[12.5px] leading-[1.5]"
          style={{ color: "var(--funnel-ink-soft)" }}
        >
          {snapshot.cta.resultNote}
        </p>
      ) : null}
    </div>
  );
}

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
        "inline-flex min-h-[52px] w-full items-center justify-center px-6 text-[15px] font-semibold text-white transition-opacity disabled:opacity-40",
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

/** Fila de opción del handoff: padding 20px, radius 14px, dot 9px. */
function OptionRow({
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
      className="flex w-full items-center gap-3 p-5 text-left text-[15px] font-medium transition-all duration-150"
      style={{
        borderRadius: "14px",
        border: selected
          ? "2px solid var(--funnel-primary)"
          : "1px solid var(--funnel-line)",
        backgroundColor: selected
          ? "color-mix(in srgb, var(--funnel-primary) 7%, transparent)"
          : "transparent",
        padding: selected ? "19px" : "20px",
      }}
    >
      <span
        className="size-[9px] shrink-0 rounded-full"
        style={{
          backgroundColor: selected
            ? "var(--funnel-primary)"
            : "var(--funnel-line)",
        }}
      />
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
      <p className="mt-8 text-[12.5px]" style={{ color: "var(--funnel-ink-soft)" }}>
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
      className="mt-8 inline-flex min-h-14 w-full items-center justify-center px-6 text-[15px] font-semibold text-white"
      style={{
        backgroundColor: "var(--funnel-primary)",
        borderRadius: "var(--funnel-radius)",
      }}
    >
      {cta.label}
    </a>
  );
}
