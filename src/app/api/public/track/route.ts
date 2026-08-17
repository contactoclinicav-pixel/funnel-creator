import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, guardPublic } from "@/app/api/public/_lib";
import { trackSessionEvent } from "@/server/services/public-runner";

const schema = z.object({
  sessionId: z.string().min(1).max(64),
  type: z.enum(["RESULT_VIEWED", "CTA_CLICKED"]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  const guard = await guardPublic(request, "track", 60, schema);
  if ("response" in guard) return guard.response;

  const result = await trackSessionEvent(guard.data);
  if ("error" in result) return badRequest(result.error);
  return NextResponse.json({ ok: true });
}
