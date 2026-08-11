import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedFetch } from "@/lib/api/authenticated";

const chatSchema = z.object({
  message: z.string().trim().min(1).max(3000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2000),
      })
    )
    .optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Mensaje inválido." }, { status: 422 });
  }

  const result = await authenticatedFetch<{
    response: string;
  }>("/v1/llm/chat", {
    method: "POST",
    body: JSON.stringify(parsed.data),
  });
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data);
}