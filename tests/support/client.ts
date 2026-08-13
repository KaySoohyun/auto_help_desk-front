import { randomUUID } from "node:crypto";

export const CSRF_COOKIE = "csrf_token";

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  /** Envía el header x-csrf-token automáticamente (default true para métodos ≠ GET). */
  withCsrf?: boolean;
}

export interface AdminCredentials {
  email: string;
  password: string;
}

export function adminCredentials(): AdminCredentials {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("Faltan ADMIN_EMAIL / ADMIN_PASSWORD en .env");
  }
  return { email, password };
}

/**
 * Cliente HTTP de test: replica el comportamiento del navegador frente al BFF.
 * Mantiene el jar de cookies (access/refresh/csrf) y adjunta el header
 * x-csrf-token en métodos mutantes, tal como lo hace bffClient.ts.
 */
export class TestClient {
  baseUrl: string;
  private cookies = new Map<string, string>();

  constructor(baseUrl: string = process.env.TEST_APP_URL ?? "http://localhost:3000") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  getCookie(name: string): string | null {
    return this.cookies.get(name) ?? null;
  }

  get csrfToken(): string | null {
    return this.getCookie(CSRF_COOKIE);
  }

  get cookieHeader(): string {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }

  async request(
    path: string,
    { method = "GET", body, headers = {}, withCsrf = true }: RequestOptions = {}
  ): Promise<Response> {
    const methodUppercase = method.toUpperCase();
    const headersInit: Record<string, string> = { ...headers };
    if (this.cookies.size > 0) headersInit["Cookie"] = this.cookieHeader;
    if (withCsrf && methodUppercase !== "GET" && this.csrfToken) {
      headersInit["x-csrf-token"] = this.csrfToken;
    }
    if (body !== undefined) headersInit["Content-Type"] = "application/json";

    const res = await fetch(`${this.baseUrl}${path}`, {
      method: methodUppercase,
      headers: headersInit,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      redirect: "manual",
    });

    const setCookies =
      typeof res.headers.getSetCookie === "function"
        ? res.headers.getSetCookie()
        : (res.headers.get("set-cookie") ?? "").split(",").filter(Boolean);
    for (const sc of setCookies) {
      const pair = sc.split(";")[0];
      const eq = pair.indexOf("=");
      if (eq === -1) continue;
      this.cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }

    return res;
  }

  /** Login con las credenciales de admin de .env. */
  async login(): Promise<Response> {
    const { email, password } = adminCredentials();
    return this.request("/api/bff/auth/login", {
      method: "POST",
      body: { email, password },
    });
  }
}

export function newCorrelationId(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `f-${randomUUID()}`;
}
