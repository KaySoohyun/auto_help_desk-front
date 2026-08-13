import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedFetch } from "@/lib/api/authenticated";
import type { Ticket } from "@/types/ticket.types";

const paramsSchema = z.object({
  ticketId: z.coerce.number().int().positive(),
});

const updateTicketSchema = z
  .object({
    status: z.enum(["open", "in_progress", "on_hold", "closed"]).optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    category: z.string().trim().max(100).optional(),
    assignee_id: z.coerce.number().int().positive().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Sin cambios",
  });

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ ticketId: string }> }) {
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

  const parsed = updateTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 422 });
  }

  const result = await authenticatedFetch<Ticket>(`/v1/tickets/${parsedParams.data.ticketId}`, {
    method: "PATCH",
    body: parsed.data,
  }, req);
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data);
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ ticketId: string }> }) {
  const parsed = paramsSchema.safeParse(await ctx.params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ticket inválido." }, { status: 422 });
  }

  const result = await authenticatedFetch<Ticket>(`/v1/tickets/${parsed.data.ticketId}`, {}, req);
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data);
}
