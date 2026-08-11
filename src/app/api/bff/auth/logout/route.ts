import { NextResponse } from "next/server";
import { fastApiFetch } from "@/lib/api/fastapi";
import { clearAuthCookies, getAccessToken, getRefreshToken } from "@/lib/auth/cookies";

export async function POST() {
  const [accessToken, refreshToken] = await Promise.all([getAccessToken(), getRefreshToken()]);

  if (refreshToken) {
    try {
      await fastApiFetch("/auth/logout", {
        method: "POST",
        body: { refresh_token: refreshToken },
        token: accessToken,
      });
    } catch {
      // Si el refresh ya no es válido, igual limpiamos las cookies locales.
    }
  }

  await clearAuthCookies();
  return new NextResponse(null, { status: 204 });
}
