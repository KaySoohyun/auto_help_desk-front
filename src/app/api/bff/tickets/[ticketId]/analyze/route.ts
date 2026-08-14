import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedFetch } from "@/lib/api/authenticated";
import type { LlmAnalyzeOutput } from "@/types/llm.types";

const paramsSchema = z.object({
  ticketId: z.coerce.number().int().positive(),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ ticketId: string }> }) {
  const parsedParams = paramsSchema.safeParse(await ctx.params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Ticket inválido." }, { status: 422 });
  }

  const result = await authenticatedFetch<LlmAnalyzeOutput>(
    `/v1/ai/tickets/${parsedParams.data.ticketId}/analyze`,
    { method: "POST" },
    req
  );
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data);
}
