import { NextResponse } from "next/server";
import { z } from "zod";

import { badRequest, guardPublic } from "@/app/api/public/_lib";
import { createLeadFromSession } from "@/server/services/public-runner";

const schema = z.object({
  sessionId: z.string().min(1).max(64),
  name: z.string().trim().max(120).optional(),
  email: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(40).optional(),
  city: z.string().trim().max(120).optional(),
  consent: z.boolean(),
});

export async function POST(request: Request) {
  const guard = await guardPublic(request, "leads", 15, schema);
  if ("response" in guard) return guard.response;

  const result = await createLeadFromSession(guard.data);
  if ("error" in result) return badRequest(result.error);
  return NextResponse.json({ leadId: result.leadId });
}
