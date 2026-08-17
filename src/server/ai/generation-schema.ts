import { z } from "zod";

/**
 * Schema de la salida del generador de funnels por IA.
 * Diseñado para el modelo: referencias por índice (preguntas/opciones) y por
 * key (perfiles), que luego el servicio traduce a ids reales de DB.
 * La API de salida estructurada garantiza la forma; la coherencia referencial
 * se comprueba aparte con validateGenerationCoherence (permite reintentar con
 * feedback específico).
 */

const generatedOptionSchema = z.object({
  label: z.string().describe("Texto de la opción, en español, máximo ~60 caracteres"),
});

const generatedQuestionSchema = z.object({
  type: z.enum([
    "SINGLE_CHOICE",
    "MULTI_CHOICE",
    "YES_NO",
    "SCALE",
    "TEXT",
    "NUMBER",
    "EMAIL",
    "PHONE",
  ]),
  title: z.string().describe("La pregunta, en español, clara y breve"),
  description: z
    .string()
    .nullable()
    .describe("Aclaración opcional bajo la pregunta; null si no hace falta"),
  required: z.boolean(),
  options: z
    .array(generatedOptionSchema)
    .describe(
      "Opciones para SINGLE_CHOICE/MULTI_CHOICE (2-6). Para YES_NO exactamente ['Sí','No']. Vacío para el resto de tipos."
    ),
  scaleMax: z
    .number()
    .int()
    .nullable()
    .describe("Solo para SCALE: máximo de la escala (3-10); null en otros tipos"),
});

const generatedProfileSchema = z.object({
  key: z
    .string()
    .describe("Identificador estable en kebab-case, p.ej. 'perfil-preventivo'"),
  title: z.string().describe("Nombre del perfil de resultado, en español"),
  description: z
    .string()
    .describe("Descripción del resultado para el visitante (2-3 frases)"),
  recommendation: z
    .string()
    .describe("Recomendación accionable para este perfil (1-2 frases)"),
});

const generatedRuleSchema = z.object({
  questionIndex: z
    .number()
    .int()
    .describe("Índice (base 0) de la pregunta en el array questions"),
  optionIndex: z
    .number()
    .int()
    .describe("Índice (base 0) de la opción dentro de esa pregunta"),
  profileKey: z.string().describe("Key del perfil al que suma puntos"),
  points: z.number().int().describe("Puntos a sumar (1-5)"),
});

export const funnelGenerationSchema = z.object({
  name: z
    .string()
    .describe("Nombre interno del funnel, corto y descriptivo, en español"),
  goal: z.string().describe("Objetivo del funnel en una frase"),
  industry: z.string().describe("Industria o tipo de negocio"),
  audience: z.string().describe("Público objetivo en una frase"),
  intro: z.object({
    headline: z
      .string()
      .describe("Titular atractivo de la portada (máx ~90 caracteres)"),
    subheadline: z
      .string()
      .describe("Subtítulo que explica el beneficio (máx ~180 caracteres)"),
    buttonText: z.string().describe("Texto del botón de inicio, p.ej. 'Empezar'"),
  }),
  questions: z
    .array(generatedQuestionSchema)
    .describe("Entre 4 y 8 preguntas, mayormente de selección"),
  profiles: z
    .array(generatedProfileSchema)
    .describe("Entre 2 y 4 perfiles de resultado con keys únicas"),
  rules: z
    .array(generatedRuleSchema)
    .describe(
      "Reglas de puntuación: idealmente una por cada opción de las preguntas de selección"
    ),
  leadCapture: z.object({
    title: z
      .string()
      .describe("Título del formulario de captura, p.ej. '¿Dónde te enviamos tu resultado?'"),
    position: z.enum(["before_result", "after_result"]),
    askPhone: z.boolean().describe("Si conviene pedir teléfono además de nombre y email"),
    consentText: z.string().describe("Texto breve de consentimiento en español"),
  }),
  cta: z.object({
    type: z.enum(["whatsapp", "url", "booking", "purchase", "email", "phone"]),
    label: z.string().describe("Texto del botón de acción final"),
    value: z
      .string()
      .describe(
        "Número/URL/email SOLO si el usuario lo proporcionó en su información; si no, cadena vacía"
      ),
    whatsappMessage: z
      .string()
      .describe(
        "Solo para whatsapp: mensaje precargado usando {{funnel_name}} y {{result_name}}; vacío en otros tipos"
      ),
  }),
  theme: z.object({
    primaryColor: z
      .string()
      .describe("Color principal en hex #rrggbb acorde a la industria"),
    backgroundColor: z
      .string()
      .describe("Color de fondo en hex #rrggbb, normalmente claro"),
  }),
});

export type FunnelGeneration = z.infer<typeof funnelGenerationSchema>;

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/**
 * Validaciones de coherencia que el JSON Schema no puede expresar.
 * Devuelve la lista de problemas (vacía si todo es válido) para poder
 * reenviársela al modelo como feedback de reintento.
 */
export function validateGenerationCoherence(data: FunnelGeneration): string[] {
  const issues: string[] = [];

  if (data.questions.length < 3 || data.questions.length > 10) {
    issues.push(
      `questions debe tener entre 3 y 10 elementos (tiene ${data.questions.length}).`
    );
  }
  if (data.profiles.length < 2 || data.profiles.length > 4) {
    issues.push(
      `profiles debe tener entre 2 y 4 elementos (tiene ${data.profiles.length}).`
    );
  }
  const profileKeys = new Set(data.profiles.map((p) => p.key));
  if (profileKeys.size !== data.profiles.length) {
    issues.push("Las keys de profiles deben ser únicas.");
  }

  data.questions.forEach((q, i) => {
    const isChoice =
      q.type === "SINGLE_CHOICE" || q.type === "MULTI_CHOICE" || q.type === "YES_NO";
    if (isChoice && q.options.length < 2) {
      issues.push(`La pregunta ${i} (${q.type}) necesita al menos 2 opciones.`);
    }
    if (q.type === "YES_NO" && q.options.length !== 2) {
      issues.push(`La pregunta ${i} (YES_NO) debe tener exactamente 2 opciones.`);
    }
    if (!isChoice && q.options.length > 0) {
      issues.push(`La pregunta ${i} (${q.type}) no debe tener opciones.`);
    }
    if (q.type === "SCALE" && (q.scaleMax === null || q.scaleMax < 3 || q.scaleMax > 10)) {
      issues.push(`La pregunta ${i} (SCALE) necesita scaleMax entre 3 y 10.`);
    }
  });

  data.rules.forEach((rule, i) => {
    const question = data.questions[rule.questionIndex];
    if (!question) {
      issues.push(
        `La regla ${i} referencia questionIndex ${rule.questionIndex} inexistente.`
      );
      return;
    }
    if (!question.options[rule.optionIndex]) {
      issues.push(
        `La regla ${i} referencia optionIndex ${rule.optionIndex} inexistente en la pregunta ${rule.questionIndex}.`
      );
    }
    if (!profileKeys.has(rule.profileKey)) {
      issues.push(`La regla ${i} referencia profileKey '${rule.profileKey}' inexistente.`);
    }
    if (rule.points < 1 || rule.points > 5) {
      issues.push(`La regla ${i} tiene points fuera de rango 1-5.`);
    }
  });

  const hasScoringSource = data.questions.some(
    (q) =>
      q.type === "SINGLE_CHOICE" || q.type === "MULTI_CHOICE" || q.type === "YES_NO"
  );
  if (hasScoringSource && data.rules.length === 0) {
    issues.push(
      "Debe haber reglas de puntuación para que el resultado sea personalizado."
    );
  }

  if (!HEX_COLOR.test(data.theme.primaryColor)) {
    issues.push("theme.primaryColor debe ser un color hex #rrggbb.");
  }
  if (!HEX_COLOR.test(data.theme.backgroundColor)) {
    issues.push("theme.backgroundColor debe ser un color hex #rrggbb.");
  }

  return issues;
}

/** Brief recogido por el onboarding conversacional. */
export interface GenerationBrief {
  businessType: string;
  goal: string;
  product: string;
  audience: string;
  finalAction: string;
  additionalInfo?: string;
}
