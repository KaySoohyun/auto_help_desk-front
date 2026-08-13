import { describe, it, expect, beforeAll } from "vitest";
import { TestClient, seedAgent, type SeedUser } from "./support/client";

/**
 * Admin (gestión de usuarios del tenant). Sin credenciales tenant_admin a la
 * vista, estos tests validan el RBAC del backend (403 con roles insuficientes)
 * y el contrato de validación del BFF (422). La validación funcional real
 * (listar/crear/editar) queda pendiente hasta contar con un tenant_admin.
 */
describe("admin (gestión de usuarios)", () => {
  const agentClient = new TestClient();
  const platformClient = new TestClient();
  let agent: SeedUser;

  beforeAll(async () => {
    agent = await seedAgent();
    expect((await agentClient.loginWith(agent)).status).toBe(200);
    expect((await platformClient.login()).status).toBe(200);
  });

  describe("RBAC: agent con tenant pero sin rol admin", () => {
    it("GET listado → 403 Permiso insuficiente", async () => {
      const res = await agentClient.request("/api/bff/admin/users");
      expect(res.status).toBe(403);
    });

    it("POST crear usuario → 403", async () => {
      const res = await agentClient.request("/api/bff/admin/users", {
        method: "POST",
        body: { email: "nuevo@example.com", password: "password-123", role: "agent" },
      });
      expect(res.status).toBe(403);
    });

    it("PATCH editar usuario → 403", async () => {
      const res = await agentClient.request(`/api/bff/admin/users/${agent.id}`, {
        method: "PATCH",
        body: { role: "supervisor" },
      });
      expect(res.status).toBe(403);
    });
  });

  describe("platform_admin (sin tenant): gestión de usuarios a nivel plataforma", () => {
    let createdId = 0;

    it("GET listado → 403 Rol sin tenant asignado (listado es tenant-scoped)", async () => {
      const res = await platformClient.request("/api/bff/admin/users");
      expect(res.status).toBe(403);
    });

    it("POST crear usuario → 201 (platform_admin crea en cualquier tenant)", async () => {
      const res = await platformClient.request("/api/bff/admin/users", {
        method: "POST",
        body: {
          email: `platform-crea-${Date.now()}@example.com`,
          password: "password-123",
          role: "agent",
          tenant_id: "test-tenant",
        },
      });
      expect(res.status).toBe(201);
      const data = (await res.json()) as { id: number; is_active: boolean; role: string };
      expect(data.id).toBeGreaterThan(0);
      expect(data.is_active).toBe(true);
      createdId = data.id;
    });

    it("PATCH editar rol del usuario creado → 200 y refleja el cambio", async () => {
      const res = await platformClient.request(`/api/bff/admin/users/${createdId}`, {
        method: "PATCH",
        body: { role: "supervisor" },
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as { role: string };
      expect(data.role).toBe("supervisor");
    });

    it("PATCH desactivar y reactivar → 200 en ambos sentidos", async () => {
      const off = await platformClient.request(`/api/bff/admin/users/${createdId}`, {
        method: "PATCH",
        body: { is_active: false },
      });
      expect(off.status).toBe(200);
      expect(((await off.json()) as { is_active: boolean }).is_active).toBe(false);

      const on = await platformClient.request(`/api/bff/admin/users/${createdId}`, {
        method: "PATCH",
        body: { is_active: true },
      });
      expect(on.status).toBe(200);
      expect(((await on.json()) as { is_active: boolean }).is_active).toBe(true);
    });
  });

  describe("Validación del BFF (independiente del backend)", () => {
    it("GET con limit fuera de rango → 422", async () => {
      const res = await agentClient.request("/api/bff/admin/users?limit=500");
      expect(res.status).toBe(422);
    });

    it("POST con password corta → 422", async () => {
      const res = await agentClient.request("/api/bff/admin/users", {
        method: "POST",
        body: { email: "nuevo@example.com", password: "corta", role: "agent" },
      });
      expect(res.status).toBe(422);
    });

    it("POST con email inválido → 422", async () => {
      const res = await agentClient.request("/api/bff/admin/users", {
        method: "POST",
        body: { email: "no-es-email", password: "password-123", role: "agent" },
      });
      expect(res.status).toBe(422);
    });

    it("PATCH con body vacío → 422", async () => {
      const res = await agentClient.request(`/api/bff/admin/users/${agent.id}`, {
        method: "PATCH",
        body: {},
      });
      expect(res.status).toBe(422);
    });

    it("PATCH con userId inválido → 422", async () => {
      const res = await agentClient.request("/api/bff/admin/users/abc", {
        method: "PATCH",
        body: { role: "supervisor" },
      });
      expect(res.status).toBe(422);
    });
  });
});
