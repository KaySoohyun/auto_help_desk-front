import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedFetch } from "@/lib/api/authenticated";
import type { AdminUser } from "@/types/admin.types";
import type { UserRole } from "@/types/auth.types";

const USER_ROLES = ["platform_admin", "tenant_admin", "supervisor", "agent"] as const;

const paramsSchema = z.object({
  userId: z.coerce.number().int().positive(),
});

const updateUserSchema = z
  .object({
    role: z.enum(USER_ROLES).optional(),
    is_active: z.boolean().optional(),
    name: z.string().trim().min(1).max(255).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Sin cambios",
  });

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ userId: string }> }) {
  const parsedParams = paramsSchema.safeParse(await ctx.params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Usuario inválido." }, { status: 422 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 422 });
  }

  const result = await authenticatedFetch<AdminUser>(`/admin/users/${parsedParams.data.userId}`, {
    method: "PATCH",
    body: parsed.data as { role?: UserRole; is_active?: boolean; name?: string },
  }, req);
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data);
}
