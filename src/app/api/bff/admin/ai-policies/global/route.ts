import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedFetch } from "@/lib/api/authenticated";
import type { GlobalAiPolicy, GlobalAiPolicyUpdate } from "@/types/admin.types";

const updateGlobalSchema = z.object({
  llm_model: z.string().trim().min(1).max(100).optional(),
  ai_confidence_threshold: z.coerce.number().min(0).max(1).optional(),
  guardrails_enabled: z.boolean().optional(),
  llm_rate_max_calls: z.coerce.number().int().min(1).optional(),
});

export async function GET(req: NextRequest) {
  const result = await authenticatedFetch<GlobalAiPolicy>("/admin/ai-policies/global", {}, req);
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data);
}

export async function PUT(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = updateGlobalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 422 });
  }

  const result = await authenticatedFetch<GlobalAiPolicy>("/admin/ai-policies/global", {
    method: "PUT",
    body: parsed.data as GlobalAiPolicyUpdate,
  }, req);
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data);
}
