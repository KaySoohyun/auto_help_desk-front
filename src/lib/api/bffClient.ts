import { ApiError } from "./errors";
import { emitSessionExpired } from "./sessionEvents";
import { CSRF_TOKEN_COOKIE } from "@/lib/auth/constants";

interface BffRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

const AUTH_PATH_PREFIX = "/api/bff/auth/";

function createCorrelationId(): string {
  const c = globalThis.crypto;
  if (typeof c?.randomUUID === "function") return c.randomUUID();
  return `f-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getCsrfTokenFromCookie(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${CSRF_TOKEN_COOKIE}=`));
  return match ? match.slice(CSRF_TOKEN_COOKIE.length + 1) : undefined;
}

export async function bffFetch<T>(path: string, options: BffRequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {}, signal } = options;

  const correlationId = createCorrelationId();
  const csrfToken = method !== "GET" ? getCsrfTokenFromCookie() : undefined;

  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-correlation-id": correlationId,
        ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (cause) {
    if (cause instanceof Error && cause.name === "AbortError") throw cause;
    throw new ApiError(0, "No se pudo conectar con el servidor.", String(cause), correlationId);
  }

  if (!res.ok) {
    if (res.status === 401 && !path.startsWith(AUTH_PATH_PREFIX)) {
      emitSessionExpired();
    }
    let message = `Error ${res.status}.`;
    try {
      const data = await res.json();
      if (data && typeof data.error === "string") message = data.error;
    } catch {
      /* sin body JSON */
    }
    throw new ApiError(res.status, message, undefined, correlationId);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
