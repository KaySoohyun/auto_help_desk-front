import { NextResponse } from "next/server";
import { fastApiFetch } from "@/lib/api/fastapi";
import { ApiError } from "@/lib/api/errors";
import { getAccessToken } from "@/lib/auth/cookies";
import type { TenantInfo } from "@/types/auth.types";

export async function GET() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Sin sesión." }, { status: 401 });
  }

  try {
    const tenants = await fastApiFetch<TenantInfo[]>("/auth/tenants", {
      token: accessToken,
    });

    return NextResponse.json(tenants);
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 401) {
        return NextResponse.json({ error: "Sesión expirada." }, { status: 401 });
      }
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Error inesperado." }, { status: 500 });
  }
}
