import { NextResponse } from "next/server";
import { z } from "zod";

import { clientIp, rateLimit } from "@/lib/rate-limit";

/** Valor de respuesta permitido desde el cliente público. */
export const answerValueSchema = z.union([
  z.array(z.string().max(64)).max(20),
  z.string().max(2000),
  z.number().finite(),
]);

export function tooMany() {
  return NextResponse.json(
    { error: "Demasiadas solicitudes. Intenta de nuevo en un momento." },
    { status: 429 }
  );
}

export function badRequest(message = "Solicitud inválida.") {
  return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * Guard común de endpoints públicos: rate limit por IP y parseo JSON+Zod.
 * Devuelve la respuesta de error o los datos validados.
 */
export async function guardPublic<T extends z.ZodType>(
  request: Request,
  bucket: string,
  limit: number,
  schema: T
): Promise<{ response: NextResponse } | { data: z.infer<T> }> {
  const ip = clientIp(request);
  if (!rateLimit(`${bucket}:${ip}`, limit, 60_000).allowed) {
    return { response: tooMany() };
  }
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return { response: badRequest() };
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return { response: badRequest() };
  }
  return { data: parsed.data };
}
