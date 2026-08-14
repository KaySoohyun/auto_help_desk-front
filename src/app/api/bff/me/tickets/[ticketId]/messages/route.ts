import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedFetch } from "@/lib/api/authenticated";
import type { TicketMessage } from "@/types/ticket.types";

const paramsSchema = z.object({
  ticketId: z.coerce.number().int().positive(),
});

const sendMessageSchema = z.object({
  body: z.string().trim().min(1, "Escribí un mensaje.").max(4000),
});

export async function GET(req: NextRequest, ctx: { params: Promise<{ ticketId: string }> }) {
  const parsedParams = paramsSchema.safeParse(await ctx.params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Ticket inválido." }, { status: 422 });
  }

  const result = await authenticatedFetch<TicketMessage[]>(
    `/v1/me/tickets/${parsedParams.data.ticketId}/messages`,
    {},
    req
  );
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ ticketId: string }> }) {
  const parsedParams = paramsSchema.safeParse(await ctx.params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Ticket inválido." }, { status: 422 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 422 }
    );
  }

  const result = await authenticatedFetch<TicketMessage>(
    `/v1/me/tickets/${parsedParams.data.ticketId}/messages`,
    { method: "POST", body: { body: parsed.data.body } },
    req
  );
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data, { status: 201 });
}
