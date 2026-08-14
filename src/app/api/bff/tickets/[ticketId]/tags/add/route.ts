import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedFetch } from "@/lib/api/authenticated";

const paramsSchema = z.object({
  ticketId: z.coerce.number().int().positive(),
});

const addTagSchema = z.object({
  tag_id: z.number().int().positive(),
});

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

  const parsed = addTagSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "tag_id inválido." }, { status: 422 });
  }

  const result = await authenticatedFetch<{ ticket_id: number; tag_id: number; tag_name: string }>(
    `/v1/tickets/${parsedParams.data.ticketId}/tags`,
    { method: "POST", body: parsed.data },
    req
  );
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data, { status: 201 });
}
