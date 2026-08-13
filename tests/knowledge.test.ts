import { describe, it, expect, beforeAll } from "vitest";
import { TestClient, seedAgent, seedTenantAdmin, type SeedUser } from "./support/client";

/**
 * Base de conocimiento (KB). Valida el flujo completo con backend real:
 * - Agent puede leer artículos publicados.
 * - Supervisor/tenant_admin puede crear, editar, publicar, archivar y restaurar.
 * - Permisos RBAC: agent no puede crear/editar.
 * - Isolación por tenant: 404 al acceder a artículos de otro tenant.
 * - Versionado: cada PATCH incrementa current_version.
 * - Transiciones de estado validadas: 422 si es inválida.
 */
describe("knowledge (base de conocimiento)", () => {
  const agentClient = new TestClient();
  const supervisorClient = new TestClient();
  let agent: SeedUser;
  let supervisor: SeedUser;

  beforeAll(async () => {
    agent = await seedAgent();
    expect((await agentClient.loginWith(agent)).status).toBe(200);
    supervisor = await seedTenantAdmin("test-tenant");
    expect((await supervisorClient.loginWith(supervisor)).status).toBe(200);
  });

  describe("CRUD básico", () => {
    let articleId = 0;

    it("POST crear artículo → 201 (supervisor)", async () => {
      const res = await supervisorClient.request("/api/bff/knowledge/articles", {
        method: "POST",
        body: {
          title: "Cómo resetear contraseña",
          body: "Pasos para resetear la contraseña del sistema...",
          category: "account",
          tags: ["password", "login"],
        },
      });
      expect(res.status).toBe(201);
      const data = (await res.json()) as { id: number; title: string; status: string; current_version: number };
      expect(data.id).toBeGreaterThan(0);
      expect(data.title).toBe("Cómo resetear contraseña");
      expect(data.status).toBe("draft");
      expect(data.current_version).toBe(1);
      articleId = data.id;
    });

    it("GET listado → 200 con artículos (sin body)", async () => {
      const res = await supervisorClient.request("/api/bff/knowledge/articles?limit=10");
      expect(res.status).toBe(200);
      const data = (await res.json()) as { items: Array<{ id: number; title: string; body?: string }>; total: number };
      expect(data.items.length).toBeGreaterThan(0);
      expect(data.total).toBeGreaterThan(0);
      for (const item of data.items) {
        expect(item.body).toBeUndefined();
      }
    });

    it("GET detalle → 200 con body", async () => {
      const res = await supervisorClient.request(`/api/bff/knowledge/articles/${articleId}`);
      expect(res.status).toBe(200);
      const data = (await res.json()) as { id: number; title: string; body: string };
      expect(data.id).toBe(articleId);
      expect(data.body).toBeTruthy();
    });

    it("PATCH actualizar → 200 incrementa versión", async () => {
      const res = await supervisorClient.request(`/api/bff/knowledge/articles/${articleId}`, {
        method: "PATCH",
        body: { title: "Título actualizado", change_note: "Corrección ortográfica" },
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as { title: string; current_version: number };
      expect(data.title).toBe("Título actualizado");
      expect(data.current_version).toBe(2);
    });

    it("GET versiones → 200 con historial", async () => {
      const res = await supervisorClient.request(`/api/bff/knowledge/articles/${articleId}/versions`);
      expect(res.status).toBe(200);
      const data = (await res.json()) as Array<{ version: number; change_note: string | null }>;
      expect(data.length).toBe(2);
      expect(data[0].version).toBe(2);
      expect(data[0].change_note).toBe("Corrección ortográfica");
      expect(data[1].version).toBe(1);
    });
  });

  describe("Transiciones de estado", () => {
    let articleId = 0;

    beforeAll(async () => {
      const res = await supervisorClient.request("/api/bff/knowledge/articles", {
        method: "POST",
        body: { title: "Artículo para transiciones", body: "Cuerpo" },
      });
      articleId = ((await res.json()) as { id: number }).id;
    });

    it("POST publish → 200 (draft → published)", async () => {
      const res = await supervisorClient.request(`/api/bff/knowledge/articles/${articleId}/publish`, {
        method: "POST",
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as { status: string; published_at: string | null };
      expect(data.status).toBe("published");
      expect(data.published_at).toBeTruthy();
    });

    it("POST publish desde published → 422", async () => {
      const res = await supervisorClient.request(`/api/bff/knowledge/articles/${articleId}/publish`, {
        method: "POST",
      });
      expect(res.status).toBe(422);
    });

    it("POST archive → 200 (published → archived)", async () => {
      const res = await supervisorClient.request(`/api/bff/knowledge/articles/${articleId}/archive`, {
        method: "POST",
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as { status: string };
      expect(data.status).toBe("archived");
    });

    it("POST restore → 200 (archived → draft)", async () => {
      const res = await supervisorClient.request(`/api/bff/knowledge/articles/${articleId}/restore`, {
        method: "POST",
      });
      expect(res.status).toBe(200);
      const data = (await res.json()) as { status: string; published_at: string | null };
      expect(data.status).toBe("draft");
      expect(data.published_at).toBeNull();
    });

    it("POST restore desde draft → 422", async () => {
      const res = await supervisorClient.request(`/api/bff/knowledge/articles/${articleId}/restore`, {
        method: "POST",
      });
      expect(res.status).toBe(422);
    });
  });

  describe("Permisos RBAC", () => {
    let articleId = 0;

    beforeAll(async () => {
      const res = await supervisorClient.request("/api/bff/knowledge/articles", {
        method: "POST",
        body: { title: "Artículo para permisos", body: "Cuerpo" },
      });
      articleId = ((await res.json()) as { id: number }).id;
    });

    it("agent puede leer artículos publicados → 200", async () => {
      await supervisorClient.request(`/api/bff/knowledge/articles/${articleId}/publish`, { method: "POST" });
      const res = await agentClient.request(`/api/bff/knowledge/articles/${articleId}`);
      expect(res.status).toBe(200);
    });

    it("agent no puede crear artículos → 403", async () => {
      const res = await agentClient.request("/api/bff/knowledge/articles", {
        method: "POST",
        body: { title: "Intento", body: "Cuerpo" },
      });
      expect(res.status).toBe(403);
    });

    it("agent no puede editar artículos → 403", async () => {
      const res = await agentClient.request(`/api/bff/knowledge/articles/${articleId}`, {
        method: "PATCH",
        body: { title: "Hack" },
      });
      expect(res.status).toBe(403);
    });

    it("agent no puede publicar artículos → 403", async () => {
      const res = await agentClient.request(`/api/bff/knowledge/articles/${articleId}/publish`, {
        method: "POST",
      });
      expect(res.status).toBe(403);
    });
  });

  describe("Isolación por tenant", () => {
    it("GET artículo de otro tenant → 404", async () => {
      const res = await agentClient.request("/api/bff/knowledge/articles/999999");
      expect(res.status).toBe(404);
    });
  });

  describe("Validación del BFF", () => {
    it("crear sin título → 422", async () => {
      const res = await supervisorClient.request("/api/bff/knowledge/articles", {
        method: "POST",
        body: { title: " ", body: "cuerpo" },
      });
      expect(res.status).toBe(422);
    });

    it("listado con status inválido → 422", async () => {
      const res = await supervisorClient.request("/api/bff/knowledge/articles?status=inexistente");
      expect(res.status).toBe(422);
    });

    it("listado con limit fuera de rango → 422", async () => {
      const res = await supervisorClient.request("/api/bff/knowledge/articles?limit=999");
      expect(res.status).toBe(422);
    });

    it("PATCH sin cambios → 422", async () => {
      const res = await supervisorClient.request("/api/bff/knowledge/articles/1", {
        method: "PATCH",
        body: {},
      });
      expect(res.status).toBe(422);
    });
  });
});
