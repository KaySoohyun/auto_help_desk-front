import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedFetch } from "@/lib/api/authenticated";
import type { SuggestionRecord } from "@/types/llm.types";

const paramsSchema = z.object({
  ticketId: z.coerce.number().int().positive(),
});

export async function GET(req: NextRequest, ctx: { params: Promise<{ ticketId: string }> }) {
  const parsedParams = paramsSchema.safeParse(await ctx.params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Ticket inválido." }, { status: 422 });
  }

  const result = await authenticatedFetch<SuggestionRecord[]>(
    `/v1/ai/tickets/${parsedParams.data.ticketId}/suggestions`,
    { method: "GET" },
    req
  );
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data);
}
