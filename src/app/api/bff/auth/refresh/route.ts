import { NextResponse } from "next/server";
import { fastApiFetch } from "@/lib/api/fastapi";
import { ApiError } from "@/lib/api/errors";
import { clearAuthCookies, getRefreshToken, setAuthCookies } from "@/lib/auth/cookies";
import type { TokenResponse } from "@/types/auth.types";

export async function POST() {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return NextResponse.json({ error: "Sin sesión." }, { status: 401 });
  }

  try {
    const tokens = await fastApiFetch<TokenResponse>("/auth/refresh", {
      method: "POST",
      body: { refresh_token: refreshToken },
    });

    await setAuthCookies(tokens.access_token, tokens.expires_in, tokens.refresh_token);

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 422)) {
      await clearAuthCookies();
      return NextResponse.json({ error: "Sesión expirada." }, { status: 401 });
    }
    return NextResponse.json({ error: "No se pudo renovar la sesión." }, { status: 500 });
  }
}
