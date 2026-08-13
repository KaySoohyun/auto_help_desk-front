import { describe, it, expect, beforeAll } from "vitest";
import { TestClient, seedAgent, type SeedUser } from "./support/client";

/**
 * El backend FastAPI NO expone `/v1/kb/*` todavía (pendiente documentado en
 * roadmap/feature 007). Estos tests validan que el contrato del BFF llega al
 * backend y que éste responde 404 en cada operación, más las validaciones
 * propias del BFF (422) que no dependen del backend.
 */
describe("knowledge (base de conocimiento)", () => {
  const client = new TestClient();
  let agent: SeedUser;

  beforeAll(async () => {
    agent = await seedAgent();
    const login = await client.loginWith(agent);
    expect(login.status).toBe(200);
  });

  it("GET listado → 404 (endpoint /v1/kb/* pendiente en FastAPI)", async () => {
    const res = await client.request("/api/bff/knowledge/articles?limit=10");
    expect(res.status).toBe(404);
  });

  it("POST crear artículo → 404 (backend no expone /v1/kb/articles)", async () => {
    const res = await client.request("/api/bff/knowledge/articles", {
      method: "POST",
      body: { title: "Artículo de test", body: "Cuerpo del artículo" },
    });
    expect(res.status).toBe(404);
  });

  it("GET detalle → 404", async () => {
    const res = await client.request("/api/bff/knowledge/articles/1");
    expect(res.status).toBe(404);
  });

  it("PATCH actualizar → 404", async () => {
    const res = await client.request("/api/bff/knowledge/articles/1", {
      method: "PATCH",
      body: { title: "Título nuevo" },
    });
    expect(res.status).toBe(404);
  });

  it("GET versiones → 404", async () => {
    const res = await client.request("/api/bff/knowledge/articles/1/versions");
    expect(res.status).toBe(404);
  });

  it("POST publish/archive/restore → 404 en cada una", async () => {
    for (const action of ["publish", "archive", "restore"]) {
      const res = await client.request(`/api/bff/knowledge/articles/1/${action}`, {
        method: "POST",
      });
      expect(res.status).toBe(404);
    }
  });

  it("validación BFF: crear sin título → 422 (no llega al backend)", async () => {
    const res = await client.request("/api/bff/knowledge/articles", {
      method: "POST",
      body: { title: " ", body: "cuerpo" },
    });
    expect(res.status).toBe(422);
  });

  it("validación BFF: listado con status inválido → 422", async () => {
    const res = await client.request("/api/bff/knowledge/articles?status=inexistente");
    expect(res.status).toBe(422);
  });
});
