import { NextRequest, NextResponse } from "next/server";
import { authenticatedFetch } from "@/lib/api/authenticated";
import type { OrchestratorInfo } from "@/types/admin.types";

export async function GET(req: NextRequest) {
  const result = await authenticatedFetch<OrchestratorInfo>("/v1/ai/info", {}, req);
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data);
}
