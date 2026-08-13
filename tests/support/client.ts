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

export interface SeedUser {
  id: number;
  email: string;
  password: string;
  role: "agent" | "tenant_admin" | "supervisor" | "platform_admin";
  tenantId: string | null;
}

export function adminCredentials(): AdminCredentials {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("Faltan ADMIN_EMAIL / ADMIN_PASSWORD en .env");
  }
  return { email, password };
}

/** URL del backend FastAPI (para sembrar datos de test). */
export function backendUrl(): string {
  return process.env.TEST_BACKEND_URL ?? process.env.URL_BACKEND_DEV ?? "http://localhost:8000";
}

/**
 * Registra un usuario agente en `test-tenant` directamente contra FastAPI.
 * Solo se usa para sembrar datos de test en el backend dev: el frontend no
 * expone registro y los flujos de la app siempre van por el BFF.
 */
export async function seedAgent(): Promise<SeedUser> {
  const email = `tester-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  const password = "tester-pass-123";
  const res = await fetch(`${backendUrl()}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role: "agent", tenant_id: "test-tenant" }),
  });
  if (!res.ok) {
    throw new Error(`No se pudo sembrar el agent de test (HTTP ${res.status})`);
  }
  const user = (await res.json()) as { id: number; email: string; role: SeedUser["role"]; tenant_id: string | null };
  return { id: user.id, email, password, role: user.role, tenantId: user.tenant_id };
}

/**
 * Crea un tenant_admin directamente contra FastAPI (vía platform_admin).
 * El platform_admin del .env crea el usuario y luego hacemos login con él.
 */
export async function seedTenantAdmin(tenantId: string = "test-tenant"): Promise<SeedUser> {
  const { email: adminEmail, password: adminPassword } = adminCredentials();

  // Login como platform_admin
  const loginRes = await fetch(`${backendUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });
  if (!loginRes.ok) {
    throw new Error(`No se pudo login como platform_admin (HTTP ${loginRes.status})`);
  }
  const { access_token } = (await loginRes.json()) as { access_token: string };

  // Crear tenant_admin
  const email = `ta-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  const password = "ta-pass-123";
  const createRes = await fetch(`${backendUrl()}/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`,
    },
    body: JSON.stringify({ email, password, role: "tenant_admin", tenant_id: tenantId }),
  });
  if (!createRes.ok) {
    throw new Error(`No se pudo sembrar el tenant_admin (HTTP ${createRes.status})`);
  }
  const user = (await createRes.json()) as { id: number; email: string; role: SeedUser["role"]; tenant_id: string | null };
  return { id: user.id, email, password, role: user.role, tenantId: user.tenant_id };
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

  /** Login con un usuario específico (p. ej. un agent sembrado). */
  async loginWith(user: Pick<SeedUser, "email" | "password">): Promise<Response> {
    return this.request("/api/bff/auth/login", {
      method: "POST",
      body: { email: user.email, password: user.password },
    });
  }
}

export function newCorrelationId(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `f-${randomUUID()}`;
}
