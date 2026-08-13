import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedFetch } from "@/lib/api/authenticated";
import type { LlmFeedbackOutput } from "@/types/llm.types";

const feedbackSchema = z.object({
  ticketId: z.coerce.number().int().positive(),
  suggestion_id: z.coerce.number().int().positive(),
  action: z.enum(["accepted", "edited", "rejected", "flagged"]),
  reason: z.string().trim().max(500).optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de feedback inválidos." }, { status: 422 });
  }

  const { ticketId, ...feedback } = parsed.data;
  const result = await authenticatedFetch<LlmFeedbackOutput>(
    `/v1/ai/tickets/${ticketId}/feedback`,
    { method: "POST", body: feedback },
    req
  );
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data);
}
