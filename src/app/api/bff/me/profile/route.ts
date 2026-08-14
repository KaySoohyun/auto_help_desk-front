import { NextRequest, NextResponse } from "next/server";
import { authenticatedFetch } from "@/lib/api/authenticated";
import type { PersonaProfile } from "@/types/persona.types";

export async function GET(req: NextRequest) {
  const result = await authenticatedFetch<PersonaProfile>("/v1/me", {}, req);
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data);
}
