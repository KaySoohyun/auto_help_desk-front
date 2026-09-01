import { NextRequest, NextResponse } from "next/server";
import { authenticatedFetch } from "@/lib/api/authenticated";
import type { Agent } from "@/types/agent.types";

export async function GET(req: NextRequest) {
  const result = await authenticatedFetch<Agent[]>("/v1/agents", {}, req);
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data);
}