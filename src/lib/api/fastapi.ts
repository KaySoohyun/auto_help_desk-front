import { ApiError } from "./errors";
import { BACKEND_URL } from "./config";

interface FastApiRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  correlationId?: string | null;
}

function extractDetail(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    // Errores de validación FastAPI: [{ loc, msg, type }]
    return detail
      .map((item) => {
        const msg = typeof item === "object" && item ? (item as { msg?: string }).msg : undefined;
        return msg ?? String(item);
      })
      .join("; ");
  }
  return undefined;
}

export async function fastApiFetch<T>(
  path: string,
  options: FastApiRequestOptions = {}
): Promise<T> {
  const { method = "GET", body, token, headers = {}, signal, correlationId } = options;

  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(correlationId ? { "X-Request-ID": correlationId } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
      cache: "no-store",
    });
  } catch (cause) {
    if (cause instanceof Error && cause.name === "AbortError") throw cause;
    throw new ApiError(0, "No se pudo conectar con el servicio.", String(cause));
  }

  const backendTraceId = res.headers.get("x-request-id") || undefined;

  if (!res.ok) {
    let detail: string | undefined;
    try {
      detail = extractDetail(await res.json());
    } catch {
      /* sin body JSON */
    }
    throw new ApiError(res.status, detail ?? `Error ${res.status} del servicio.`, detail, backendTraceId);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
