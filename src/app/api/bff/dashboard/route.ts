import { NextRequest, NextResponse } from "next/server";
import { authenticatedFetch } from "@/lib/api/authenticated";
import type { DashboardKpis } from "@/types/dashboard.types";

export async function GET(req: NextRequest) {
  const result = await authenticatedFetch<DashboardKpis>("/v1/dashboard", {}, req);
  if (result instanceof NextResponse) return result;
  return NextResponse.json(result.data);
}
