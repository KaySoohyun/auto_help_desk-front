import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedFetch } from "@/lib/api/authenticated";
import type { KbArticle } from "@/types/knowledge.types";

const paramsSchema = z.object({
  articleId: z.coerce.number().int().positive(),
});

const updateArticleSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    body: z.string().trim().min(1).max(10000).optional(),
    category: z.string().trim().max(100).optional(),
    tags: z.array(z.string().trim().min(1).max(50)).max(10).optional(),
    change_note: z.string().trim().max(200).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Sin cambios",
  });

export async function GET(req: NextRequest, ctx: { params: Promise<{ articleId: string }> }) {
  const parsed = paramsSchema.safeParse(await ctx.params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Artículo inválido." }, { status: 422 });
  }

  const result = await authenticatedFetch<KbArticle>(`/v1/kb/articles/${parsed.data.articleId}`, {}, req);
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ articleId: string }> }) {
  const parsedParams = paramsSchema.safeParse(await ctx.params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "Artículo inválido." }, { status: 422 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = updateArticleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 422 });
  }

  const result = await authenticatedFetch<KbArticle>(
    `/v1/kb/articles/${parsedParams.data.articleId}`,
    { method: "PATCH", body: parsed.data },
    req
  );
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data);
}
