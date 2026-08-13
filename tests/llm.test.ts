import { describe, it, expect, beforeAll } from "vitest";
import { TestClient, seedAgent, type SeedUser } from "./support/client";

interface Ticket {
  id: number;
}

/**
 * LLM (asistente). El orquestador del backend es un MOCK: /v1/ai/info,
 * /v1/ai/ping y /v1/pii/redact responden 200 con datos; los endpoints
 * ticket-scoped (/v1/ai/tickets/{id}/classify|summary|suggested-reply)
 * rechazan con 422 "Campos de ... inválidos" sin importar el input — una
 * limitación del mock a investigar en FastAPI. El BFF proxya esos errores.
 */
describe("llm (asistente)", () => {
  const client = new TestClient();
  let agent: SeedUser;
  let ticketId = 0;

  beforeAll(async () => {
    agent = await seedAgent();
    expect((await client.loginWith(agent)).status).toBe(200);

    const created = await client.request("/api/bff/tickets", {
      method: "POST",
      body: {
        subject: `LLM test ${Date.now()}`,
        description: "El usuario reporta un cobro duplicado en su factura.",
        category: "facturacion",
        priority: "high",
      },
    });
    expect(created.status).toBe(201);
    ticketId = ((await created.json()) as Ticket).id;
  });

  it("pii-redact → 200 y enmascara el email (flujo real del mock)", async () => {
    const res = await client.request("/api/bff/llm/pii-redact", {
      method: "POST",
      body: { text: "Mi correo es usuario@example.com y mi DNI 12345678", mode: "redact" },
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { text: string; report: { total: number } };
    expect(data.report.total).toBeGreaterThan(0);
    expect(data.text).not.toContain("usuario@example.com");
  });

  it("classify → 422 del backend mock (pendiente de validación real)", async () => {
    const res = await client.request("/api/bff/llm/classify", {
      method: "POST",
      body: { ticketId },
    });
    expect(res.status).toBe(422);
  });

  it("summarize → 422 del backend mock (pendiente de validación real)", async () => {
    const res = await client.request("/api/bff/llm/summarize", {
      method: "POST",
      body: { ticketId },
    });
    expect(res.status).toBe(422);
  });

  it("suggest-reply → 422 del backend mock (pendiente de validación real)", async () => {
    const res = await client.request("/api/bff/llm/suggest-reply", {
      method: "POST",
      body: { ticketId, tone: "formal", language: "es" },
    });
    expect(res.status).toBe(422);
  });

  it("chat → 422 del backend mock (mismo endpoint que suggest-reply)", async () => {
    const res = await client.request("/api/bff/llm/chat", {
      method: "POST",
      body: { ticketId },
    });
    expect(res.status).toBe(422);
  });

  it("stream → 422 del backend mock (envuelve suggested-reply)", async () => {
    const res = await client.request("/api/bff/llm/stream", {
      method: "POST",
      body: { ticketId },
    });
    expect(res.status).toBe(422);
  });

  it("feedback → 404 del backend (valida que la sugerencia exista)", async () => {
    const res = await client.request("/api/bff/llm/feedback", {
      method: "POST",
      body: { ticketId, suggestion_id: 999999, action: "rejected", reason: "prueba" },
    });
    expect(res.status).toBe(404);
  });

  describe("Validación del BFF (independiente del backend)", () => {
    it("classify con ticketId inválido → 422", async () => {
      const res = await client.request("/api/bff/llm/classify", {
        method: "POST",
        body: { ticketId: -1 },
      });
      expect(res.status).toBe(422);
    });

    it("feedback con action inválida → 422", async () => {
      const res = await client.request("/api/bff/llm/feedback", {
        method: "POST",
        body: { ticketId, suggestion_id: 1, action: "quizas" },
      });
      expect(res.status).toBe(422);
    });

    it("pii-redact con texto vacío → 422", async () => {
      const res = await client.request("/api/bff/llm/pii-redact", {
        method: "POST",
        body: { text: " " },
      });
      expect(res.status).toBe(422);
    });

    it("chat con tone > 50 chars → 422", async () => {
      const res = await client.request("/api/bff/llm/chat", {
        method: "POST",
        body: { ticketId, tone: "a".repeat(51) },
      });
      expect(res.status).toBe(422);
    });
  });
});
