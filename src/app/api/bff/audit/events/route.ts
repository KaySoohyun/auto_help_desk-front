import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedFetch } from "@/lib/api/authenticated";
import type { AuditEvent } from "@/types/audit.types";

const EVENT_SERVICES = ["auth", "tickets", "admin", "ai", "audit", "pii"] as const;
const EVENT_RESULTS = ["success", "failure", "disabled"] as const;

const listQuerySchema = z.object({
  action: z.string().trim().min(1).max(100).optional(),
  service: z.enum(EVENT_SERVICES).optional(),
  user_id: z.coerce.number().int().min(1).optional(),
  result: z.enum(EVENT_RESULTS).optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parsed = listQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Filtros inválidos." }, { status: 422 });
  }

  const { limit, offset, ...filters } = parsed.data;
  const qs = new URLSearchParams();
  if (filters.action) qs.set("action", filters.action);
  if (filters.service) qs.set("service", filters.service);
  if (filters.user_id !== undefined) qs.set("user_id", String(filters.user_id));
  if (filters.result) qs.set("result", filters.result);
  if (filters.date_from) qs.set("date_from", filters.date_from);
  if (filters.date_to) qs.set("date_to", filters.date_to);
  qs.set("limit", String(limit));
  qs.set("offset", String(offset));

  const result = await authenticatedFetch<AuditEvent[]>(`/audit/events?${qs.toString()}`);
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data);
}
