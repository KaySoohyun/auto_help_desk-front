import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedFetch } from "@/lib/api/authenticated";

const classifySchema = z.object({
  text: z.string().trim().min(1).max(3000),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = classifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Texto inválido o demasiado largo." }, { status: 422 });
  }

  const result = await authenticatedFetch<{
    categories: Array<{ id: string; name: string; score: number }>;
  }>("/v1/llm/classify", {
    method: "POST",
    body: JSON.stringify(parsed.data),
  });
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data);
}