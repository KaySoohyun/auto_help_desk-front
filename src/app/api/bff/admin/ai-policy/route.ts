import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedFetch } from "@/lib/api/authenticated";
import type { AdminAiPolicy, AdminAiPolicyUpdate } from "@/types/admin.types";

const updatePolicySchema = z.object({
  ai_enabled: z.boolean().optional(),
  tone: z.string().trim().min(1).max(50).optional(),
  language: z.string().trim().min(1).max(10).optional(),
  allowed_categories: z.array(z.string().trim().min(1).max(50)).max(100).optional(),
  escalation_rules: z
    .record(z.string().trim().min(1).max(50), z.string().trim().min(1).max(100))
    .optional(),
});

export async function GET() {
  const result = await authenticatedFetch<AdminAiPolicy>("/admin/ai-policy");
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

  const parsed = updatePolicySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 422 });
  }

  const result = await authenticatedFetch<AdminAiPolicy>("/admin/ai-policy", {
    method: "PUT",
    body: parsed.data as AdminAiPolicyUpdate,
  });
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data);
}
