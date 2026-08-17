import type {
  FunnelSnapshot,
  SnapshotProfile,
  SnapshotQuestion,
} from "@/lib/funnel-config";

/**
 * Motor de resultados. Puro y sin dependencias de UI ni de base de datos:
 * lo usan el preview del builder (cliente) y el runner público (servidor).
 */

/** Valor de respuesta por tipo de pregunta:
 *  - choice/yes-no: array de optionId seleccionados
 *  - scale/number: número
 *  - text/email/phone: string
 */
export type AnswerValue = string[] | string | number;
export type AnswerMap = Record<string, AnswerValue>;

export interface ResultOutcome {
  /** Puntos por perfil (key = profile.id). */
  scores: Record<string, number>;
  /** Perfil ganador o null si no hay perfiles/reglas aplicables. */
  profile: SnapshotProfile | null;
}

function selectedOptionIds(value: AnswerValue | undefined): string[] {
  return Array.isArray(value) ? value : [];
}

/** Calcula los puntos por perfil y el perfil ganador. */
export function computeResult(
  snapshot: FunnelSnapshot,
  answers: AnswerMap
): ResultOutcome {
  const scores: Record<string, number> = {};
  for (const profile of snapshot.profiles) {
    scores[profile.id] = 0;
  }

  for (const rule of snapshot.rules) {
    if (rule.action !== "ADD_SCORE") continue;
    if (!rule.targetProfileId || !rule.points) continue;
    if (!(rule.targetProfileId in scores)) continue;
    const selected = selectedOptionIds(answers[rule.questionId]);
    if (rule.optionId && selected.includes(rule.optionId)) {
      scores[rule.targetProfileId] += rule.points;
    }
  }

  let winner: SnapshotProfile | null = null;
  let bestScore = -Infinity;
  const ordered = [...snapshot.profiles].sort((a, b) => a.order - b.order);
  for (const profile of ordered) {
    const score = scores[profile.id] ?? 0;
    if (score > bestScore) {
      bestScore = score;
      winner = profile;
    }
  }

  // Sin perfiles, o con perfiles pero sin ningún punto anotado y sin reglas:
  // si no hay perfiles no hay resultado; si hay perfiles pero todo quedó en 0,
  // gana el primero por orden (comportamiento estable y predecible).
  if (ordered.length === 0) {
    return { scores, profile: null };
  }
  return { scores, profile: winner };
}

/** Preguntas ordenadas del snapshot. */
export function orderedQuestions(snapshot: FunnelSnapshot): SnapshotQuestion[] {
  return [...snapshot.questions].sort((a, b) => a.order - b.order);
}

/**
 * Devuelve el índice (en el listado ordenado) de la siguiente pregunta a
 * mostrar tras responder la actual, aplicando reglas GOTO_QUESTION.
 * Devuelve null si el funnel terminó.
 */
export function nextQuestionIndex(
  snapshot: FunnelSnapshot,
  currentIndex: number,
  answers: AnswerMap
): number | null {
  const questions = orderedQuestions(snapshot);
  const current = questions[currentIndex];
  if (!current) return null;

  const selected = selectedOptionIds(answers[current.id]);
  const gotoRule = snapshot.rules.find(
    (rule) =>
      rule.action === "GOTO_QUESTION" &&
      rule.questionId === current.id &&
      rule.targetQuestionId &&
      rule.optionId &&
      selected.includes(rule.optionId)
  );

  if (gotoRule?.targetQuestionId) {
    const targetIdx = questions.findIndex(
      (q) => q.id === gotoRule.targetQuestionId
    );
    // Solo saltos hacia adelante: evita bucles infinitos.
    if (targetIdx > currentIndex) {
      return targetIdx;
    }
  }

  const nextIdx = currentIndex + 1;
  return nextIdx < questions.length ? nextIdx : null;
}

/** Valida si un valor de respuesta cuenta como "respondida" para required. */
export function isAnswered(value: AnswerValue | undefined): boolean {
  if (value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;
  return Number.isFinite(value);
}
