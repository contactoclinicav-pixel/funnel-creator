import { NextResponse } from "next/server";
import { z } from "zod";

import {
  answerValueSchema,
  badRequest,
  guardPublic,
} from "@/app/api/public/_lib";
import { saveAnswer } from "@/server/services/public-runner";

const schema = z.object({
  sessionId: z.string().min(1).max(64),
  questionId: z.string().min(1).max(64),
  value: answerValueSchema,
});

export async function POST(request: Request) {
  const guard = await guardPublic(request, "answers", 120, schema);
  if ("response" in guard) return guard.response;

  const result = await saveAnswer(guard.data);
  if ("error" in result) return badRequest(result.error);
  return NextResponse.json({ ok: true });
}
