import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedFetch } from "@/lib/api/authenticated";
import type { Ticket, TicketList } from "@/types/ticket.types";

const listQuerySchema = z.object({
  status: z.enum(["open", "in_progress", "on_hold", "closed"]).optional(),
  category: z.string().max(100).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assignee_id: z.coerce.number().int().positive().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const createTicketSchema = z.object({
  subject: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(4000),
  category: z.string().trim().max(100).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  language: z.string().trim().max(10).default("es"),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parsed = listQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Filtros inválidos." }, { status: 422 });
  }

  const qs = new URLSearchParams();
  const { limit, offset, ...filters } = parsed.data;
  qs.set("limit", String(limit));
  qs.set("offset", String(offset));
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") qs.set(key, String(value));
  }

  const result = await authenticatedFetch<TicketList>(`/v1/tickets?${qs.toString()}`, {}, req);
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = createTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 422 });
  }

  const result = await authenticatedFetch<Ticket>("/v1/tickets", {
    method: "POST",
    body: parsed.data,
  }, req);
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data, { status: 201 });
}
