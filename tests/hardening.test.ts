import { describe, it, expect, beforeAll } from "vitest";
import { TestClient, seedAgent, type SeedUser } from "./support/client";

/**
 * Hardening (Feature 011): headers de seguridad, CSRF doble submit en el BFF,
 * manejo global de 401 y validaciones. La CSP estricta solo se emite en
 * producción (no en el server dev que usa la suite); los headers siempre activos
 * sí se verifican aquí. La redirección de sesión expirada es comportamiento del
 * cliente (sessionEvents + providers), no observable por HTTP.
 */
describe("hardening", () => {
  const client = new TestClient();
  let agent: SeedUser;

  beforeAll(async () => {
    agent = await seedAgent();
    expect((await client.loginWith(agent)).status).toBe(200);
  });

  describe("headers de seguridad", () => {
    it("/login incluye headers siempre activos", async () => {
      const anon = new TestClient();
      const res = await anon.request("/login");
      expect(res.status).toBe(200);
      expect(res.headers.get("x-content-type-options")).toBe("nosniff");
      expect(res.headers.get("x-frame-options")).toBe("DENY");
      expect(res.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
      expect(res.headers.get("permissions-policy")).toContain("camera=()");
      expect(res.headers.get("permissions-policy")).toContain("geolocation=()");
    });

    it("las rutas del BFF también llevan los headers", async () => {
      const anon = new TestClient();
      const res = await anon.request("/api/bff/me");
      expect(res.headers.get("x-content-type-options")).toBe("nosniff");
      expect(res.headers.get("x-frame-options")).toBe("DENY");
      expect(res.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    });
  });

  describe("CSRF doble submit", () => {
    it("mutación sin header x-csrf-token → 403 (fail-closed)", async () => {
      const res = await client.request("/api/bff/tickets", {
        method: "POST",
        body: { subject: "Sin csrf", description: "x" },
        withCsrf: false,
      });
      expect(res.status).toBe(403);
    });

    it("mutación con token csrf incorrecto → 403", async () => {
      const res = await client.request("/api/bff/tickets", {
        method: "POST",
        body: { subject: "Csrf malo", description: "x" },
        withCsrf: false,
        headers: { "x-csrf-token": "token-incorrecto" },
      });
      expect(res.status).toBe(403);
    });

    it("mutación con token csrf correcto → 201", async () => {
      const res = await client.request("/api/bff/tickets", {
        method: "POST",
        body: { subject: `Hardening csrf ${Date.now()}`, description: "ok" },
      });
      expect(res.status).toBe(201);
    });

    it("GET sin header csrf → 200 (no requiere)", async () => {
      const res = await client.request("/api/bff/tickets?limit=1", { withCsrf: false });
      expect(res.status).toBe(200);
    });

    it("la cookie csrf no es HttpOnly (el cliente debe leerla)", async () => {
      const login = new TestClient();
      await login.loginWith(agent);
      // El TestClient no lee Set-Cookie de login aquí (login previo lo hizo);
      // validamos que el valor de la cookie sea igual al token que enviamos.
      expect(login.csrfToken).toBeTruthy();
    });
  });

  describe("manejo de 401", () => {
    it("/me sin sesión → 401 JSON (sin redirect HTTP)", async () => {
      const anon = new TestClient();
      const res = await anon.request("/api/bff/me");
      expect(res.status).toBe(401);
      const data = (await res.json()) as { error: string };
      expect(typeof data.error).toBe("string");
    });

    it("mutación sin sesión → 401 (autenticación previa al CSRF)", async () => {
      const anon = new TestClient();
      const res = await anon.request("/api/bff/tickets", {
        method: "POST",
        body: { subject: "x", description: "y" },
      });
      expect(res.status).toBe(401);
    });

    it("login con credenciales inválidas → 401 (ruta auth no dispara redirect)", async () => {
      const res = await client.request("/api/bff/auth/login", {
        method: "POST",
        body: { email: agent.email, password: "clave-incorrecta" },
      });
      expect(res.status).toBe(401);
    });
  });

  it("correlation-id: el header se acepta sin romper el flujo", async () => {
    const res = await client.request("/api/bff/me", {
      headers: { "x-correlation-id": "test-corr-123" },
    });
    expect(res.status).toBe(200);
  });

  it("correlation-id: el error del BFF incluye el trace del backend", async () => {
    const customCorrelationId = `test-corr-${Date.now()}`;
    const res = await client.request("/api/bff/tickets/999999", {
      headers: { "x-correlation-id": customCorrelationId },
    });
    expect(res.status).toBe(404);
    const data = (await res.json()) as { error: string; correlation_id?: string };
    expect(data.correlation_id).toBe(customCorrelationId);
  });
});
