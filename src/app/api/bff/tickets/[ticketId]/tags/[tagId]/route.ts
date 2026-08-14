import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedFetch } from "@/lib/api/authenticated";

const paramsSchema = z.object({
  ticketId: z.coerce.number().int().positive(),
  tagId: z.coerce.number().int().positive(),
});

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ ticketId: string; tagId: string }> }) {
  const parsed = paramsSchema.safeParse(await ctx.params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Parámetros inválidos." }, { status: 422 });
  }

  const result = await authenticatedFetch<void>(
    `/v1/tickets/${parsed.data.ticketId}/tags/${parsed.data.tagId}`,
    { method: "DELETE" },
    req
  );
  if (result instanceof NextResponse) return result;
  return new NextResponse(null, { status: 204 });
}
