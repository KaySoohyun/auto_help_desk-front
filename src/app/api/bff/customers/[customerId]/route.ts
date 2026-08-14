import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedFetch } from "@/lib/api/authenticated";
import type { Customer } from "@/types/customer.types";

const paramsSchema = z.object({
  customerId: z.coerce.number().int().positive(),
});

export async function GET(req: NextRequest, ctx: { params: Promise<{ customerId: string }> }) {
  const parsed = paramsSchema.safeParse(await ctx.params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Customer inválido." }, { status: 422 });
  }

  const result = await authenticatedFetch<Customer>(
    `/v1/customers/${parsed.data.customerId}`,
    {},
    req
  );
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data);
}
