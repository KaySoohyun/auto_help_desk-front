import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedFetch } from "@/lib/api/authenticated";
import type { LlmPiiRedactOutput } from "@/types/llm.types";

const piiRedactSchema = z.object({
  text: z.string().trim().min(1).max(10000),
  mode: z.enum(["off", "detect", "redact"]).default("redact"),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = piiRedactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Texto inválido o demasiado largo." }, { status: 422 });
  }

  const result = await authenticatedFetch<LlmPiiRedactOutput>("/v1/pii/redact", {
    method: "POST",
    body: parsed.data,
  });
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data);
}
