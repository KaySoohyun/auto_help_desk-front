import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedFetch } from "@/lib/api/authenticated";
import type { KbArticleVersion } from "@/types/knowledge.types";

const paramsSchema = z.object({
  articleId: z.coerce.number().int().positive(),
});

export async function GET(req: NextRequest, ctx: { params: Promise<{ articleId: string }> }) {
  const parsed = paramsSchema.safeParse(await ctx.params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Artículo inválido." }, { status: 422 });
  }

  const result = await authenticatedFetch<KbArticleVersion[]>(
    `/v1/kb/articles/${parsed.data.articleId}/versions`,
    {},
    req
  );
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data);
}
