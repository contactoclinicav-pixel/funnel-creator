import "server-only";

/**
 * Rate limiting con ventana deslizante en memoria.
 * Suficiente para una instancia (MVP). La interfaz está pensada para poder
 * sustituir la implementación por Redis/Upstash sin tocar a los llamadores.
 */

const buckets = new Map<string, number[]>();

const MAX_BUCKETS = 10_000; // techo de memoria ante abuso distribuido

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean } {
  const now = Date.now();
  const windowStart = now - windowMs;

  let timestamps = buckets.get(key);
  if (!timestamps) {
    if (buckets.size >= MAX_BUCKETS) {
      // Purga oportunista de buckets viejos.
      for (const [k, ts] of buckets) {
        if (ts.length === 0 || ts[ts.length - 1] < windowStart) {
          buckets.delete(k);
        }
        if (buckets.size < MAX_BUCKETS / 2) break;
      }
      if (buckets.size >= MAX_BUCKETS) {
        // Bajo presión extrema preferimos rechazar a crecer sin límite.
        return { allowed: false };
      }
    }
    timestamps = [];
    buckets.set(key, timestamps);
  }

  // Elimina marcas fuera de la ventana.
  while (timestamps.length > 0 && timestamps[0] < windowStart) {
    timestamps.shift();
  }

  if (timestamps.length >= limit) {
    return { allowed: false };
  }
  timestamps.push(now);
  return { allowed: true };
}

/** Extrae la IP del request (detrás de proxy usa el primer x-forwarded-for). */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}
