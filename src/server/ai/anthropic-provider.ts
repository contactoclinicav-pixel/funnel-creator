import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import {
  funnelGenerationSchema,
  validateGenerationCoherence,
  type FunnelGeneration,
  type GenerationBrief,
} from "@/server/ai/generation-schema";
import { AIGenerationError, type AIProvider } from "@/server/ai/provider";

const SYSTEM_PROMPT = `Eres el motor de generación de AI Funnel Creator, un SaaS que crea funnels interactivos de conversión (tipo quiz/diagnóstico) para negocios sin conocimientos técnicos.

A partir del brief del usuario, diseña un funnel completo y listo para publicar. Todo el contenido va en español neutro, con el tono de un profesional del marketing: claro, cercano y orientado a conversión.

Reglas de diseño:
- Entre 4 y 8 preguntas, una por pantalla. La mayoría de tipo SINGLE_CHOICE (el visitante avanza con un toque); usa MULTI_CHOICE, YES_NO o SCALE cuando aporten. Evita preguntas de texto libre salvo que el brief lo pida.
- NO incluyas preguntas pidiendo nombre, email o teléfono: el formulario de captura de leads los pide aparte.
- Entre 2 y 4 perfiles de resultado con keys únicas en kebab-case. Cada perfil debe sentirse personalizado y valioso, con una recomendación que empuje hacia la acción final.
- Reglas de puntuación: cada opción de cada pregunta de selección debe sumar puntos (1-5) a algún perfil, de modo que respuestas distintas lleven a perfiles distintos. Los índices son base 0 y deben existir; las profileKey deben coincidir con las keys de profiles.
- La acción final del brief determina cta.type: WhatsApp→whatsapp, reservar→booking, comprar→purchase, solicitar información/visitar página/CTA personalizado→url, llamada→phone, email→email.
- cta.value solo si el usuario dio un dato concreto (número, URL, email) en su información adicional; si no, déjalo vacío ("") para que lo complete después.
- Colores del tema acordes a la industria (fondo claro, color principal con buen contraste).
- El titular de la portada promete el valor del resultado, no describe el formulario.`;

function briefToPrompt(brief: GenerationBrief): string {
  return [
    `Tipo de negocio: ${brief.businessType}`,
    `Objetivo del funnel: ${brief.goal}`,
    `Producto o servicio a promocionar: ${brief.product}`,
    `Público objetivo: ${brief.audience}`,
    `Acción final deseada: ${brief.finalAction}`,
    brief.additionalInfo?.trim()
      ? `Información adicional del usuario: ${brief.additionalInfo.trim()}`
      : null,
    "",
    "Genera el funnel completo.",
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";
  private client: Anthropic;
  private model: string;

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new AIGenerationError(
        "La IA no está configurada. Añade ANTHROPIC_API_KEY en el servidor.",
        false
      );
    }
    this.client = new Anthropic();
    this.model = process.env.AI_MODEL || "claude-sonnet-5";
  }

  async generateFunnel(brief: GenerationBrief): Promise<FunnelGeneration> {
    const userPrompt = briefToPrompt(brief);

    let generation = await this.requestGeneration([
      { role: "user", content: userPrompt },
    ]);
    let issues = validateGenerationCoherence(generation);

    if (issues.length > 0) {
      // Un reintento con el error como feedback; nunca guardamos a medias.
      generation = await this.requestGeneration([
        { role: "user", content: userPrompt },
        {
          role: "assistant",
          content: `He generado un funnel pero contiene errores de coherencia.`,
        },
        {
          role: "user",
          content: `Tu funnel anterior tenía estos problemas:\n- ${issues.join(
            "\n- "
          )}\n\nGenera el funnel de nuevo corrigiéndolos todos.`,
        },
      ]);
      issues = validateGenerationCoherence(generation);
      if (issues.length > 0) {
        throw new AIGenerationError(
          "La IA no logró generar un funnel coherente. Vuelve a intentarlo."
        );
      }
    }

    return generation;
  }

  private async requestGeneration(
    messages: Anthropic.MessageParam[]
  ): Promise<FunnelGeneration> {
    let response: Awaited<ReturnType<typeof this.client.messages.parse>>;
    try {
      response = await this.client.messages.parse({
        model: this.model,
        max_tokens: 16000,
        system: SYSTEM_PROMPT,
        messages,
        output_config: {
          format: zodOutputFormat(funnelGenerationSchema),
        },
      });
    } catch (error) {
      if (error instanceof Anthropic.APIConnectionError) {
        throw new AIGenerationError(
          "No se pudo conectar con el servicio de IA. Revisa tu conexión e inténtalo de nuevo."
        );
      }
      if (error instanceof Anthropic.AuthenticationError) {
        throw new AIGenerationError(
          "La clave de IA no es válida. Revisa ANTHROPIC_API_KEY.",
          false
        );
      }
      if (error instanceof Anthropic.RateLimitError) {
        throw new AIGenerationError(
          "El servicio de IA está saturado. Espera un momento e inténtalo de nuevo."
        );
      }
      if (error instanceof Anthropic.APIError) {
        console.error("[ai] Error de la API de Anthropic:", error.status, error.message);
        throw new AIGenerationError(
          "El servicio de IA devolvió un error. Inténtalo de nuevo."
        );
      }
      throw error;
    }

    if (response.stop_reason === "refusal") {
      throw new AIGenerationError(
        "La IA declinó generar este contenido. Ajusta la descripción e inténtalo de nuevo.",
        false
      );
    }
    if (response.stop_reason === "max_tokens" || !response.parsed_output) {
      throw new AIGenerationError(
        "La generación quedó incompleta. Vuelve a intentarlo."
      );
    }
    return response.parsed_output as FunnelGeneration;
  }
}

let cachedProvider: AIProvider | null = null;

/** Devuelve el proveedor de IA configurado, o lanza si no hay ninguno. */
export function getAIProvider(): AIProvider {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AIGenerationError(
      "La generación con IA no está configurada todavía. Añade tu ANTHROPIC_API_KEY en el archivo .env del servidor.",
      false
    );
  }
  if (!cachedProvider) {
    cachedProvider = new AnthropicProvider();
  }
  return cachedProvider;
}
