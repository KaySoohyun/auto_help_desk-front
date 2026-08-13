import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedFetch } from "@/lib/api/authenticated";
import type { LlmChatOutput } from "@/types/llm.types";

const chatSchema = z.object({
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

  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de chat inválidos." }, { status: 422 });
  }

  const { ticketId, tone, language } = parsed.data;
  const result = await authenticatedFetch<LlmChatOutput>(
    `/v1/ai/tickets/${ticketId}/suggested-reply`,
    { method: "POST", body: { tone, language } },
    req
  );
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data);
}
