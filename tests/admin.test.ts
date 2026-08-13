import { describe, it, expect, beforeAll } from "vitest";
import { TestClient, seedAgent, seedTenantAdmin, type SeedUser } from "./support/client";

/**
 * Admin (gestión de usuarios del tenant). Valida RBAC del backend (403 con roles
 * insuficientes), el contrato de validación del BFF (422), y el flujo completo
 * con tenant_admin (listar/crear/editar usuarios del propio tenant).
 */
describe("admin (gestión de usuarios)", () => {
  const agentClient = new TestClient();
  const platformClient = new TestClient();
  const tenantAdminClient = new TestClient();
  let agent: SeedUser;
  let tenantAdmin: SeedUser;

  beforeAll(async () => {
    agent = await seedAgent();
    expect((await agentClient.loginWith(agent)).status).toBe(200);
    expect((await platformClient.login()).status).toBe(200);
    // Usar un tenant diferente para evitar afectar otros tests
    tenantAdmin = await seedTenantAdmin("test-tenant-admin");
    expect((await tenantAdminClient.loginWith(tenantAdmin)).status).toBe(200);
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

  describe("tenant_admin: gestión de usuarios del propio tenant", () => {
    let createdUserId = 0;

    it("GET listado → 200 con usuarios del propio tenant", async () => {
      const res = await tenantAdminClient.request("/api/bff/admin/users");
      expect(res.status).toBe(200);
      const data = (await res.json()) as Array<{ id: number; tenant_id: string }>;
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      // Todos los usuarios deben ser del mismo tenant
      expect(data.every((u) => u.tenant_id === tenantAdmin.tenantId)).toBe(true);
    });

    it("POST crear usuario en su tenant → 201", async () => {
      const res = await tenantAdminClient.request("/api/bff/admin/users", {
        method: "POST",
        body: {
          email: `ta-created-${Date.now()}@example.com`,
          password: "password-123",
          role: "agent",
          tenant_id: tenantAdmin.tenantId,
        },
      });
      expect(res.status).toBe(201);
      const data = (await res.json()) as { id: number; role: string; tenant_id: string };
      expect(data.id).toBeGreaterThan(0);
      expect(data.role).toBe("agent");
      expect(data.tenant_id).toBe(tenantAdmin.tenantId);
      createdUserId = data.id;
    });

    it("POST crear usuario en otro tenant → 403", async () => {
      const res = await tenantAdminClient.request("/api/bff/admin/users", {
        method: "POST",
        body: {
          email: `other-tenant-${Date.now()}@example.com`,
          password: "password-123",
          role: "agent",
          tenant_id: "otro-tenant",
        },
      });
      expect(res.status).toBe(403);
    });

    it("POST crear platform_admin → 403 (tenant_admin no puede)", async () => {
      const res = await tenantAdminClient.request("/api/bff/admin/users", {
        method: "POST",
        body: {
          email: `boss-${Date.now()}@example.com`,
          password: "password-123",
          role: "platform_admin",
        },
      });
      expect(res.status).toBe(403);
    });

    it("PATCH editar rol del usuario creado → 200", async () => {
      const res = await tenantAdminClient.request(`/api/bff/admin/users/${createdUserId}`, {
        method: "PATCH",
        body: { role: "supervisor" },
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as { role: string };
      expect(data.role).toBe("supervisor");
    });

    it("PATCH editar usuario de otro tenant → 404", async () => {
      // Intentar editar un ID inexistente (que podría ser de otro tenant)
      const res = await tenantAdminClient.request("/api/bff/admin/users/999999", {
        method: "PATCH",
        body: { role: "agent" },
      });
      expect(res.status).toBe(404);
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
