import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, guardPublic } from "@/app/api/public/_lib";
import { startSession } from "@/server/services/public-runner";

const schema = z.object({
  slug: z.string().min(1).max(80),
  visitorId: z.string().min(8).max(64),
  utmSource: z.string().max(120).nullish(),
  utmMedium: z.string().max(120).nullish(),
  utmCampaign: z.string().max(120).nullish(),
  referrer: z.string().max(500).nullish(),
});

export async function POST(request: Request) {
  const guard = await guardPublic(request, "sessions", 30, schema);
  if ("response" in guard) return guard.response;

  const result = await startSession(guard.data);
  if ("error" in result) return badRequest(result.error);
  return NextResponse.json({ sessionId: result.sessionId });
}
