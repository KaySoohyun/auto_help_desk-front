import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedFetch } from "@/lib/api/authenticated";
import type { AdminUser, AdminUserList } from "@/types/admin.types";
import type { UserRole } from "@/types/auth.types";

const USER_ROLES = ["platform_admin", "tenant_admin", "supervisor", "agent"] as const;

const listQuerySchema = z.object({
  q: z.string().trim().max(255).optional(),
  role: z.enum(USER_ROLES).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const createUserSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  role: z.enum(USER_ROLES),
  tenant_id: z.string().trim().max(64).optional(),
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
  if (parsed.data.q) qs.set("q", parsed.data.q);
  if (parsed.data.role) qs.set("role", parsed.data.role);

  const result = await authenticatedFetch<AdminUserList>(`/admin/users?${qs.toString()}`, {}, req);
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

  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 422 });
  }

  const result = await authenticatedFetch<AdminUser>("/admin/users", {
    method: "POST",
    body: parsed.data as { name: string; email: string; password: string; role: UserRole; tenant_id?: string },
  }, req);
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data, { status: 201 });
}
