import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedFetch } from "@/lib/api/authenticated";
import type { Ticket } from "@/types/ticket.types";

const paramsSchema = z.object({
  ticketId: z.coerce.number().int().positive(),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ ticketId: string }> }) {
  const parsed = paramsSchema.safeParse(await ctx.params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ticket inválido." }, { status: 422 });
  }

  const result = await authenticatedFetch<Ticket>(`/v1/tickets/${parsed.data.ticketId}/close`, {
    method: "POST",
  }, req);
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data);
}
