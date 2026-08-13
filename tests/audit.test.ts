import { describe, it, expect, beforeAll } from "vitest";
import { TestClient, seedAgent, type SeedUser } from "./support/client";

/**
 * Auditoría (eventos del tenant). Sin credenciales tenant_admin/auditor a la
 * vista, estos tests validan el RBAC del backend (403 con roles insuficientes)
 * y el contrato de validación del BFF (422). La lectura real de eventos queda
 * pendiente hasta contar con un usuario con permiso audit:view.
 */
describe("audit (eventos)", () => {
  const agentClient = new TestClient();
  const platformClient = new TestClient();
  let agent: SeedUser;

  beforeAll(async () => {
    agent = await seedAgent();
    expect((await agentClient.loginWith(agent)).status).toBe(200);
    expect((await platformClient.login()).status).toBe(200);
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
