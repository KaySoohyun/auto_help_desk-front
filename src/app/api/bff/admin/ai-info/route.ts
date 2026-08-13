import { NextResponse } from "next/server";
import { authenticatedFetch } from "@/lib/api/authenticated";
import type { OrchestratorInfo } from "@/types/admin.types";

export async function GET() {
  const result = await authenticatedFetch<OrchestratorInfo>("/v1/ai/info");
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data);
}
