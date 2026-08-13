import { describe, it, expect, beforeAll } from "vitest";
import { TestClient, seedAgent, type SeedUser } from "./support/client";

interface OrchestratorInfo {
  provider: string;
  model: string;
}

interface GlobalPolicy {
  llm_model?: string | null;
  ai_confidence_threshold?: number | null;
  guardrails_enabled?: boolean | null;
  llm_rate_max_calls?: number | null;
}

/**
 * Configuración IA: la policy del tenant es tenant-scoped (requiere tenant_admin),
 * la policy global es a nivel plataforma (platform_admin) y /v1/ai/info es de
 * solo lectura para cualquier sesión autenticada.
 */
describe("ai-policy (configuración LLM)", () => {
  const agentClient = new TestClient();
  const platformClient = new TestClient();
  let agent: SeedUser;

  beforeAll(async () => {
    agent = await seedAgent();
    expect((await agentClient.loginWith(agent)).status).toBe(200);
    expect((await platformClient.login()).status).toBe(200);
  });

  describe("orquestador (solo lectura)", () => {
    it("ai-info con agent → 403 (requiere rol admin)", async () => {
      const res = await agentClient.request("/api/bff/admin/ai-info");
      expect(res.status).toBe(403);
    });

    it("ai-info con platform_admin → 200 y shape correcto", async () => {
      const res = await platformClient.request("/api/bff/admin/ai-info");
      expect(res.status).toBe(200);
      const info = (await res.json()) as OrchestratorInfo;
      expect(typeof info.provider).toBe("string");
      expect(typeof info.model).toBe("string");
    });
  });

  describe("policy del tenant (tenant-scoped)", () => {
    it("GET con agent → 403 Permiso insuficiente", async () => {
      const res = await agentClient.request("/api/bff/admin/ai-policy");
      expect(res.status).toBe(403);
    });

    it("GET con platform_admin sin tenant → 403 Rol sin tenant asignado", async () => {
      const res = await platformClient.request("/api/bff/admin/ai-policy");
      expect(res.status).toBe(403);
    });

    it("PUT con agent → 403", async () => {
      const res = await agentClient.request("/api/bff/admin/ai-policy", {
        method: "PUT",
        body: { ai_enabled: true },
      });
      expect(res.status).toBe(403);
    });
  });

  describe("policy global (a nivel plataforma)", () => {
    it("GET con agent → 403 Permiso insuficiente", async () => {
      const res = await agentClient.request("/api/bff/admin/ai-policies/global");
      expect(res.status).toBe(403);
    });

    it("GET con platform_admin → 200 con shape correcto", async () => {
      const res = await platformClient.request("/api/bff/admin/ai-policies/global");
      expect(res.status).toBe(200);
      const policy = (await res.json()) as GlobalPolicy;
      expect(typeof policy.llm_model).toBe("string");
      expect(typeof policy.ai_confidence_threshold).toBe("number");
      expect(typeof policy.guardrails_enabled).toBe("boolean");
    });

    it("PUT round-trip idempotente con platform_admin → 200 y no altera config", async () => {
      const get = await platformClient.request("/api/bff/admin/ai-policies/global");
      const current = (await get.json()) as GlobalPolicy;

      const put = await platformClient.request("/api/bff/admin/ai-policies/global", {
        method: "PUT",
        body: current,
      });
      expect(put.status).toBe(200);

      const after = await platformClient.request("/api/bff/admin/ai-policies/global");
      expect(JSON.parse(JSON.stringify(await after.json()))).toEqual(JSON.parse(JSON.stringify(current)));
    });
  });

  describe("Validación del BFF (independiente del backend)", () => {
    it("PUT tenant policy con tone > 50 chars → 422", async () => {
      const res = await agentClient.request("/api/bff/admin/ai-policy", {
        method: "PUT",
        body: { tone: "a".repeat(51) },
      });
      expect(res.status).toBe(422);
    });

    it("PUT tenant policy con escalation_rules inválido → 422", async () => {
      const res = await agentClient.request("/api/bff/admin/ai-policy", {
        method: "PUT",
        body: { escalation_rules: { "": "" } },
      });
      expect(res.status).toBe(422);
    });

    it("PUT con JSON inválido → 400", async () => {
      const res = await fetch(`${agentClient.baseUrl}/api/bff/admin/ai-policy`, {
        method: "PUT",
        headers: {
          Cookie: agentClient.cookieHeader,
          "Content-Type": "application/json",
          ...(agentClient.csrfToken ? { "x-csrf-token": agentClient.csrfToken } : {}),
        },
        body: "no-es-json",
      });
      expect(res.status).toBe(400);
    });
  });
});
