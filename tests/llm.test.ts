import { describe, it, expect, beforeAll } from "vitest";
import { TestClient, seedAgent, type SeedUser } from "./support/client";

interface Ticket {
  id: number;
}

/**
 * LLM (asistente). El orquestador del backend usa un mock task-aware que
 * devuelve JSON válido para classify/summary/reply. Los endpoints ticket-scoped
 * responden 200 con datos estructurados.
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

  it("classify → 200 con clasificación del mock task-aware", async () => {
    const res = await client.request("/api/bff/llm/classify", {
      method: "POST",
      body: { ticketId },
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { category: string; suggested_priority: string; confidence: number };
    expect(data.category).toBeTruthy();
    expect(data.suggested_priority).toBeTruthy();
    expect(data.confidence).toBeGreaterThan(0);
  });

  it("summarize → 200 con resumen del mock task-aware", async () => {
    const res = await client.request("/api/bff/llm/summarize", {
      method: "POST",
      body: { ticketId },
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { summary: string; confidence: number };
    expect(data.summary).toBeTruthy();
    expect(data.confidence).toBeGreaterThan(0);
  });

  it("suggest-reply → 200 con sugerencia del mock task-aware", async () => {
    const res = await client.request("/api/bff/llm/suggest-reply", {
      method: "POST",
      body: { ticketId, tone: "formal", language: "es" },
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { suggested_reply: string; confidence: number };
    expect(data.suggested_reply).toBeTruthy();
    expect(data.confidence).toBeGreaterThan(0);
  });

  it("chat → 200 (mismo endpoint que suggest-reply)", async () => {
    const res = await client.request("/api/bff/llm/chat", {
      method: "POST",
      body: { ticketId },
    });
    expect(res.status).toBe(200);
  });

  it("stream → 200 (envuelve suggested-reply)", async () => {
    const res = await client.request("/api/bff/llm/stream", {
      method: "POST",
      body: { ticketId },
    });
    expect(res.status).toBe(200);
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
