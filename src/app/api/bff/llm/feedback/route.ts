import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedFetch } from "@/lib/api/authenticated";

const feedbackSchema = z.object({
  ticketId: z.coerce.number().int().positive(),
  action: z.enum(["accept", "edit", "regenerate", "reject"]),
  userComment: z.string().trim().max(500).optional(),
});

type FeedbackInput = z.infer<typeof feedbackSchema>;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de feedback inválidos." }, { status: 422 });
  }

  const feedbackInput: FeedbackInput = parsed.data;
  const result = await authenticatedFetch<{ success: boolean }>("/api/bff/llm/feedback", {
    method: "POST",
    body: JSON.stringify(feedbackInput),
  });
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data);
}