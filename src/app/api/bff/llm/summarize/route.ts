import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedFetch } from "@/lib/api/authenticated";
import type { LlmSummarizeOutput } from "@/types/llm.types";

const summarizeSchema = z.object({
  ticketId: z.coerce.number().int().positive(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = summarizeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ticket inválido." }, { status: 422 });
  }

  const result = await authenticatedFetch<LlmSummarizeOutput>(
    `/v1/ai/tickets/${parsed.data.ticketId}/summary`,
    { method: "POST" },
    req
  );
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data);
}
