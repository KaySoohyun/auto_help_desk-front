import { ApiError } from "./errors";
import { CSRF_TOKEN_COOKIE } from "@/lib/auth/constants";

interface BffRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
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

  const csrfToken = method !== "GET" ? getCsrfTokenFromCookie() : undefined;

  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (cause) {
    if (cause instanceof Error && cause.name === "AbortError") throw cause;
    throw new ApiError(0, "No se pudo conectar con el servidor.", String(cause));
  }

  if (!res.ok) {
    let message = `Error ${res.status}.`;
    try {
      const data = await res.json();
      if (data && typeof data.error === "string") message = data.error;
    } catch {
      /* sin body JSON */
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
