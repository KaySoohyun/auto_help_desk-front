import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedFetch } from "@/lib/api/authenticated";
import type { LlmSuggestReplyOutput } from "@/types/llm.types";

const suggestReplySchema = z.object({
  ticketId: z.coerce.number().int().positive(),
  tone: z.string().trim().max(50).optional(),
  language: z.string().trim().max(10).optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = suggestReplySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de sugerencia inválidos." }, { status: 422 });
  }

  const { ticketId, ...rest } = parsed.data;
  const result = await authenticatedFetch<LlmSuggestReplyOutput>(
    `/v1/ai/tickets/${ticketId}/suggested-reply`,
    { method: "POST", body: rest }
  );
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data);
}
