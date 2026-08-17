import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, guardPublic } from "@/app/api/public/_lib";
import { completeSession } from "@/server/services/public-runner";

const schema = z.object({
  sessionId: z.string().min(1).max(64),
});

export async function POST(request: Request) {
  const guard = await guardPublic(request, "complete", 30, schema);
  if ("response" in guard) return guard.response;

  const result = await completeSession(guard.data);
  if ("error" in result) return badRequest(result.error);
  return NextResponse.json({ profileId: result.profileId });
}
