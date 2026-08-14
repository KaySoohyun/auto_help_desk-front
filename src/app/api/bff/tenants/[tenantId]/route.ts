import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedFetch } from "@/lib/api/authenticated";
import type { Tenant } from "@/types/tenant.types";

const paramsSchema = z.object({
  tenantId: z.string().min(1),
});

export async function GET(req: NextRequest, ctx: { params: Promise<{ tenantId: string }> }) {
  const parsed = paramsSchema.safeParse(await ctx.params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Tenant inválido." }, { status: 422 });
  }

  const result = await authenticatedFetch<Tenant>(
    `/v1/tenants/${parsed.data.tenantId}`,
    {},
    req
  );
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data);
}
