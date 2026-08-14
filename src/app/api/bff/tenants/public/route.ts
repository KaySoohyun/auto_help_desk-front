import { NextResponse } from "next/server";
import { fastApiFetch } from "@/lib/api/fastapi";
import { ApiError } from "@/lib/api/errors";
import type { Tenant } from "@/types/tenant.types";

export async function GET() {
  try {
    const tenants = await fastApiFetch<Tenant[]>("/v1/tenants/public");
    return NextResponse.json(tenants);
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Error inesperado." }, { status: 500 });
  }
}
