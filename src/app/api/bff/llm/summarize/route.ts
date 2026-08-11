import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedFetch } from "@/lib/api/authenticated";

const summarizeSchema = z.object({
  text: z.string().trim().min(1).max(3000),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = summarizeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Texto inválido o demasiado largo." }, { status: 422 });
  }

  const result = await authenticatedFetch<{
    summary: Array<{ title: string; text: string }>;
  }>("/v1/llm/summarize", {
    method: "POST",
    body: JSON.stringify(parsed.data),
  });
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data);
}