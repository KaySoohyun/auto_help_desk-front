import { NextResponse } from "next/server";
import { fastApiFetch } from "@/lib/api/fastapi";
import { ApiError } from "@/lib/api/errors";
import { clearAuthCookies, getAccessToken, getRefreshToken, setAuthCookies } from "@/lib/auth/cookies";
import type { TokenResponse, UserOut } from "@/types/auth.types";

export async function GET() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Sin sesión." }, { status: 401 });
  }

  try {
    const user = await fastApiFetch<UserOut>("/auth/me", { token: accessToken });
    return NextResponse.json({ user });
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401) {
      return NextResponse.json({ error: "No se pudo obtener la sesión." }, { status: 500 });
    }

    // Access vencido: intentamos refrescar una vez y reintentamos.
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      await clearAuthCookies();
      return NextResponse.json({ error: "Sesión expirada." }, { status: 401 });
    }

    try {
      const tokens = await fastApiFetch<TokenResponse>("/auth/refresh", {
        method: "POST",
        body: { refresh_token: refreshToken },
      });
      await setAuthCookies(tokens.access_token, tokens.expires_in, tokens.refresh_token);

      const user = await fastApiFetch<UserOut>("/auth/me", { token: tokens.access_token });
      return NextResponse.json({ user });
    } catch {
      await clearAuthCookies();
      return NextResponse.json({ error: "Sesión expirada." }, { status: 401 });
    }
  }
}
