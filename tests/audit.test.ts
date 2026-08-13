import { describe, it, expect, beforeAll } from "vitest";
import { TestClient, seedAgent, seedTenantAdmin, type SeedUser } from "./support/client";

/**
 * Auditoría (eventos del tenant). Valida RBAC del backend (403 con roles
 * insuficientes), el contrato de validación del BFF (422), y la lectura real
 * de eventos con tenant_admin (que tiene permiso audit:view).
 */
describe("audit (eventos)", () => {
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
    tenantAdmin = await seedTenantAdmin("test-tenant-audit");
    expect((await tenantAdminClient.loginWith(tenantAdmin)).status).toBe(200);
  });

  describe("RBAC", () => {
    it("agent sin permiso de auditoría → 403 Permiso insuficiente", async () => {
      const res = await agentClient.request("/api/bff/audit/events?limit=10");
      expect(res.status).toBe(403);
    });

    it("platform_admin sin tenant → 403 Rol sin tenant asignado", async () => {
      const res = await platformClient.request("/api/bff/audit/events?limit=10");
      expect(res.status).toBe(403);
    });

    it("tenant_admin con permiso audit:view → 200 con eventos del propio tenant", async () => {
      const res = await tenantAdminClient.request("/api/bff/audit/events?limit=10");
      expect(res.status).toBe(200);
      const data = (await res.json()) as Array<{ tenant_id: string; action: string }>;
      expect(Array.isArray(data)).toBe(true);
      // Todos los eventos deben ser del mismo tenant
      expect(data.every((e) => e.tenant_id === tenantAdmin.tenantId)).toBe(true);
    });

    it("tenant_admin puede filtrar por action", async () => {
      const res = await tenantAdminClient.request("/api/bff/audit/events?action=auth.login_success&limit=10");
      expect(res.status).toBe(200);
      const data = (await res.json()) as Array<{ action: string }>;
      expect(data.every((e) => e.action === "auth.login_success")).toBe(true);
    });
  });

  describe("Validación del BFF (independiente del backend)", () => {
    it("service inválido → 422", async () => {
      const res = await agentClient.request("/api/bff/audit/events?service=banana");
      expect(res.status).toBe(422);
    });

    it("result inválido → 422", async () => {
      const res = await agentClient.request("/api/bff/audit/events?result=quizas");
      expect(res.status).toBe(422);
    });

    it("date_from con formato inválido → 422", async () => {
      const res = await agentClient.request("/api/bff/audit/events?date_from=2026/08/01");
      expect(res.status).toBe(422);
    });

    it("limit fuera de rango → 422", async () => {
      const res = await agentClient.request("/api/bff/audit/events?limit=999");
      expect(res.status).toBe(422);
    });

    it("user_id inválido (0) → 422", async () => {
      const res = await agentClient.request("/api/bff/audit/events?user_id=0");
      expect(res.status).toBe(422);
    });
  });
});
