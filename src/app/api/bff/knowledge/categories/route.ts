import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedFetch } from "@/lib/api/authenticated";
import type { KbCategory } from "@/types/knowledge.types";

const createSchema = z.object({
  name: z.string().trim().min(1, "Ingresá un nombre.").max(100, "Máximo 100 caracteres."),
});

export async function GET(req: NextRequest) {
  const result = await authenticatedFetch<KbCategory[]>("/v1/kb/categories", {}, req);
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 422 }
    );
  }

  const result = await authenticatedFetch<KbCategory>("/v1/kb/categories", {
    method: "POST",
    body: { name: parsed.data.name },
  }, req);
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data, { status: 201 });
}
