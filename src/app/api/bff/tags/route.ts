import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedFetch } from "@/lib/api/authenticated";
import type { Tag } from "@/types/tag.types";

const searchSchema = z.object({
  search: z.string().trim().max(50).optional().default(""),
});

const createSchema = z.object({
  name: z.string().trim().min(1).max(50),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parsed = searchSchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Búsqueda inválida." }, { status: 422 });
  }

  const qs = new URLSearchParams();
  if (parsed.data.search) qs.set("search", parsed.data.search);
  const qstring = qs.toString();

  const result = await authenticatedFetch<Tag[]>(
    `/v1/tags${qstring ? `?${qstring}` : ""}`,
    {},
    req
  );
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

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Nombre de tag inválido." }, { status: 422 });
  }

  const result = await authenticatedFetch<Tag>(
    "/v1/tags",
    { method: "POST", body: parsed.data },
    req
  );
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data, { status: 201 });
}
