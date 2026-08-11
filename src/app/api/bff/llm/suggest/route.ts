import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedFetch } from "@/lib/api/authenticated";

const suggestSchema = z.object({
  ticketId: z.coerce.number().int().positive(),
  context: z.string().trim().max(3000),
});

type Suggestion = {
  id: string;
  label: string;
  description: string;
  confidence: number;
};

type SuggestOutput = {
  suggestions: Suggestion[];
};

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = suggestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 422 });
  }

  const result = await authenticatedFetch<SuggestOutput>("/api/bff/llm/suggest", {
    method: "POST",
    body: JSON.stringify(parsed.data),
  });
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data);
}