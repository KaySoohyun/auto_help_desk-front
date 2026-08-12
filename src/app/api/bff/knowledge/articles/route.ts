import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedFetch } from "@/lib/api/authenticated";
import type { KbArticle, KbArticleList } from "@/types/knowledge.types";

const listQuerySchema = z.object({
  status: z.enum(["draft", "published", "archived"]).optional(),
  category: z.string().max(100).optional(),
  tag: z.string().max(50).optional(),
  search: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const createArticleSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(10000),
  category: z.string().trim().max(100).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(10).optional(),
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

  const result = await authenticatedFetch<KbArticleList>(`/v1/kb/articles?${qs.toString()}`);
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

  const parsed = createArticleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 422 });
  }

  const result = await authenticatedFetch<KbArticle>("/v1/kb/articles", {
    method: "POST",
    body: parsed.data,
  });
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data, { status: 201 });
}
