import { NextResponse } from "next/server";
import { fastApiFetch } from "@/lib/api/fastapi";
import { ApiError } from "@/lib/api/errors";
import { setAuthCookies, getAccessToken } from "@/lib/auth/cookies";
import type { TokenResponse, UserOut } from "@/types/auth.types";

export async function POST() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Sin sesión." }, { status: 401 });
  }

  try {
    const tokens = await fastApiFetch<TokenResponse>("/auth/clear-tenant", {
      method: "POST",
      token: accessToken,
    });

    const user = await fastApiFetch<UserOut>("/auth/me", { token: tokens.access_token });

    await setAuthCookies(tokens.access_token, tokens.expires_in, tokens.refresh_token);

    return NextResponse.json({ user });
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
