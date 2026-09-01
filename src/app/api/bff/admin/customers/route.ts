import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedFetch } from "@/lib/api/authenticated";
import type { AdminCustomerList } from "@/types/admin.types";

const listQuerySchema = z.object({
  tenant_id: z.string().trim().max(64).optional(),
  q: z.string().trim().max(255).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parsed = listQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Filtros inválidos." }, { status: 422 });
  }

  const qs = new URLSearchParams({
    limit: String(parsed.data.limit),
    offset: String(parsed.data.offset),
  });
  if (parsed.data.tenant_id) qs.set("tenant_id", parsed.data.tenant_id);
  if (parsed.data.q) qs.set("q", parsed.data.q);

  const result = await authenticatedFetch<AdminCustomerList>(`/admin/customers?${qs.toString()}`, {}, req);
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data);
}