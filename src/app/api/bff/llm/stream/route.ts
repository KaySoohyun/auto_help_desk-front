import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedFetch } from "@/lib/api/authenticated";
import type { LlmChatOutput } from "@/types/llm.types";

const streamSchema = z.object({
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

  const parsed = streamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de streaming inválidos." }, { status: 422 });
  }

  const { ticketId, tone, language } = parsed.data;

  const result = await authenticatedFetch<LlmChatOutput>(
    `/v1/ai/tickets/${ticketId}/suggested-reply`,
    { method: "POST", body: { tone, language } },
    req
  );
  if (result instanceof NextResponse) return result;

  const data = result.data;
  const sse = `data: ${JSON.stringify(data)}\n\n`;

  return new NextResponse(sse, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
