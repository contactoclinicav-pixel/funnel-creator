import "server-only";

import { rateLimit } from "@/lib/rate-limit";
import { getAIProvider } from "@/server/ai/anthropic-provider";
import { AIGenerationError } from "@/server/ai/provider";
import type {
  FunnelGeneration,
  GenerationBrief,
} from "@/server/ai/generation-schema";
import { materializeFunnelFromSpec } from "@/server/services/funnel-materializer";

interface Ctx {
  userId: string;
  workspaceId: string;
}

/**
 * Orquesta la generación: llama al proveedor de IA, y solo si la salida es
 * válida y coherente crea el funnel completo en una transacción.
 * Si algo falla, no se persiste nada (nunca funnels incompletos).
 */
export async function generateFunnelWithAI(ctx: Ctx, brief: GenerationBrief) {
  if (!rateLimit(`ai-generate:${ctx.userId}`, 10, 60 * 60 * 1000).allowed) {
    return {
      error:
        "Has alcanzado el límite de generaciones por hora. Espera un poco e inténtalo de nuevo.",
    };
  }

  let generation: FunnelGeneration;
  try {
    const provider = getAIProvider();
    generation = await provider.generateFunnel(brief);
  } catch (error) {
    if (error instanceof AIGenerationError) {
      return { error: error.message };
    }
    console.error("[ai] Error inesperado generando funnel:", error);
    return { error: "Ocurrió un error inesperado. Inténtalo de nuevo." };
  }

  const funnelId = await materializeFunnelFromSpec(ctx, generation, {
    goal: brief.goal,
    industry: brief.businessType,
    audience: brief.audience,
  });
  return { funnelId };
}
