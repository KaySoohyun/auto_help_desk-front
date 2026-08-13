import { describe, it, expect } from "vitest";
import { TestClient, adminCredentials } from "./support/client";

describe("auth", () => {
  it("login con credenciales válidas → sesión + cookies httpOnly/csrf", async () => {
    const client = new TestClient();
    const res = await client.login();

    expect(res.status).toBe(200);
    const data = (await res.json()) as { user: { email: string } };
    expect(data.user.email).toBe(adminCredentials().email);
    expect(client.getCookie("access_token")).toBeTruthy();
    expect(client.getCookie("refresh_token")).toBeTruthy();
    expect(client.getCookie("csrf_token")).toBeTruthy();

    const me = await client.request("/api/bff/me");
    expect(me.status).toBe(200);
  });

  it("login con password incorrecto → 401", async () => {
    const client = new TestClient();
    const res = await client.request("/api/bff/auth/login", {
      method: "POST",
      body: { email: adminCredentials().email, password: "incorrecta-123" },
    });
    expect(res.status).toBe(401);
    const data = (await res.json()) as { error: string };
    expect(data.error).toBe("Credenciales inválidas.");
  });

  it("login con email inválido → 422", async () => {
    const client = new TestClient();
    const res = await client.request("/api/bff/auth/login", {
      method: "POST",
      body: { email: "no-es-un-email", password: adminCredentials().password },
    });
    expect(res.status).toBe(422);
  });

  it("/me sin sesión → 401", async () => {
    const client = new TestClient();
    const res = await client.request("/api/bff/me");
    expect(res.status).toBe(401);
  });

  it("logout → limpia sesión y /me pasa a 401", async () => {
    const client = new TestClient();
    await client.login();

    const logout = await client.request("/api/bff/auth/logout", { method: "POST" });
    expect(logout.status).toBe(204);

    const me = await client.request("/api/bff/me");
    expect(me.status).toBe(401);
  });
});
