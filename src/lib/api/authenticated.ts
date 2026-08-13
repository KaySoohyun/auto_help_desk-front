import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fastApiFetch } from "./fastapi";
import { ApiError } from "./errors";
import { clearAuthCookies, getAccessToken, getRefreshToken, setAuthCookies } from "@/lib/auth/cookies";
import { getCsrfToken, setCsrfCookie, verifyCsrf } from "@/lib/auth/csrf";
import type { TokenResponse } from "@/types/auth.types";

interface AuthenticatedFetchOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * Ejecuta una request autenticada a FastAPI con refresh automático (1 retry)
 * y verificación de token CSRF para métodos mutantes.
 * Devuelve el JSON de éxito o un NextResponse de error.
 */
export async function authenticatedFetch<T>(
  path: string,
  options: AuthenticatedFetchOptions = {},
  req?: NextRequest
): Promise<{ data: T } | NextResponse> {
  const { method = "GET", body, headers = {} } = options;

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Sin sesión." }, { status: 401 });
  }

  if (method !== "GET") {
    const csrfValid = await verifyCsrf(req);
    if (!csrfValid) {
      return NextResponse.json({ error: "Token CSRF inválido." }, { status: 403 });
    }
  } else if (!(await getCsrfToken())) {
    await setCsrfCookie();
  }

  const call = (token: string) =>
    fastApiFetch<T>(path, { method, body, token, headers });

  try {
    return { data: await call(accessToken) };
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401) {
      return apiErrorResponse(err);
    }
  }

  // Access vencido: refrescar una vez y reintentar.
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
    return { data: await call(tokens.access_token) };
  } catch (err) {
    await clearAuthCookies();
    if (err instanceof ApiError && (err.status === 401 || err.status === 422)) {
      return NextResponse.json({ error: "Sesión expirada." }, { status: 401 });
    }
    return apiErrorResponse(err);
  }
}

export function apiErrorResponse(err: unknown): NextResponse {
  if (err instanceof ApiError && err.status === 0) {
    return NextResponse.json({ error: "No se pudo conectar con el servicio." }, { status: 502 });
  }
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.detail ?? "Error del servicio." }, { status: err.status });
  }
  return NextResponse.json({ error: "Error inesperado." }, { status: 500 });
}
