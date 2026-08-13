import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedFetch } from "@/lib/api/authenticated";
import type { TicketMessage } from "@/types/ticket.types";

const paramsSchema = z.object({
  ticketId: z.coerce.number().int().positive(),
});

const createMessageSchema = z.object({
  body: z.string().trim().min(1).max(5000),
});

export async function GET(_req: Request, ctx: { params: Promise<{ ticketId: string }> }) {
  const parsed = paramsSchema.safeParse(await ctx.params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ticket inválido." }, { status: 422 });
  }

  const result = await authenticatedFetch<TicketMessage[]>(`/v1/tickets/${parsed.data.ticketId}/messages`);
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ ticketId: string }> }) {
  const parsed = paramsSchema.safeParse(await ctx.params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ticket inválido." }, { status: 422 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsedBody = createMessageSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "El mensaje no puede estar vacío." }, { status: 422 });
  }

  const result = await authenticatedFetch<TicketMessage>(`/v1/tickets/${parsed.data.ticketId}/messages`, {
    method: "POST",
    body: parsedBody.data,
  }, req);
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data, { status: 201 });
}
