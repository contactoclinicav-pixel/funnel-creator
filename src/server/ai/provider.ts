import "server-only";

import type {
  FunnelGeneration,
  GenerationBrief,
} from "@/server/ai/generation-schema";

/**
 * Abstracción del proveedor de IA. Toda llamada a IA vive detrás de esta
 * interfaz y se ejecuta exclusivamente server-side; cambiar de proveedor
 * significa añadir una implementación nueva, sin tocar el resto de la app.
 */
export interface AIProvider {
  readonly name: string;
  generateFunnel(brief: GenerationBrief): Promise<FunnelGeneration>;
}

/** Error de generación con mensaje apto para mostrar al usuario. */
export class AIGenerationError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean = true
  ) {
    super(message);
    this.name = "AIGenerationError";
  }
}
