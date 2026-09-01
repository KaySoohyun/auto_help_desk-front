import { describe, it, expect, beforeAll } from "vitest";
import { TestClient, seedAgent, type SeedUser } from "./support/client";

interface Ticket {
  id: number;
  subject: string;
  status: string;
  priority: string | null;
  category: string | null;
  assignee_id: number | null;
}

interface TicketList {
  items: Ticket[];
  total: number;
  limit: number;
  offset: number;
}

const UNIQUE = `test-${Date.now()}`;
const SUBJECT = `Ticket funcional ${UNIQUE}`;

describe("tickets", () => {
  const client = new TestClient();
  let ticketId = 0;
  let agent: SeedUser;

  beforeAll(async () => {
    agent = await seedAgent();
    const login = await client.loginWith(agent);
    expect(login.status).toBe(200);
  });

  it("listado de tickets → 200 con shape correcto", async () => {
    const res = await client.request("/api/bff/tickets?limit=5");
    expect(res.status).toBe(200);
    const data = (await res.json()) as TicketList;
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.total).toBeGreaterThanOrEqual(0);
    expect(data.limit).toBe(5);
  });

  it("creación de ticket → 201 con id", async () => {
    const res = await client.request("/api/bff/tickets", {
      method: "POST",
      body: {
        subject: SUBJECT,
        description: `Descripción generada por el test funcional ${UNIQUE}.`,
        category: "testing",
        priority: "high",
      },
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as Ticket;
    expect(data.id).toBeGreaterThan(0);
    expect(data.subject).toBe(SUBJECT);
    ticketId = data.id;
  });

  it("detalle del ticket creado → 200 y coincide", async () => {
    const res = await client.request(`/api/bff/tickets/${ticketId}`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as Ticket;
    expect(data.id).toBe(ticketId);
    expect(data.subject).toBe(SUBJECT);
  });

  it("filtro por status=open incluye el ticket creado", async () => {
    const res = await client.request("/api/bff/tickets?status=open&limit=50");
    expect(res.status).toBe(200);
    const data = (await res.json()) as TicketList;
    expect(data.items.some((t) => t.id === ticketId)).toBe(true);
    for (const t of data.items) expect(t.status).toBe("open");
  });

  it("update del ticket (priority/status/category) → 200 y refleja cambios", async () => {
    const res = await client.request(`/api/bff/tickets/${ticketId}`, {
      method: "PATCH",
      body: { priority: "urgent", status: "in_progress", category: "testing-updated" },
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as Ticket;
    expect(data.priority).toBe("urgent");
    expect(data.status).toBe("in_progress");
    expect(data.category).toBe("testing-updated");
  });

  it("asignación del ticket al propio agente → 200 y assignee_id coincide", async () => {
    const res = await client.request(`/api/bff/tickets/${ticketId}`, {
      method: "PATCH",
      body: { assignee_id: agent.id },
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as Ticket & {
      assignee: { id: number; name: string | null; email: string } | null;
    };
    expect(data.assignee_id).toBe(agent.id);
    expect(data.assignee?.id).toBe(agent.id);
    expect(data.assignee?.name).toBeTruthy();
  });

  it("agente no puede asignar el ticket a otro agente → 403", async () => {
    const other = await seedAgent();
    const res = await client.request(`/api/bff/tickets/${ticketId}`, {
      method: "PATCH",
      body: { assignee_id: other.id },
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("vos mismo");
  });

  it("mensajes: crear → 201 y listar → contiene el mensaje", async () => {
    const body = `Mensaje del test ${UNIQUE}`;
    const created = await client.request(`/api/bff/tickets/${ticketId}/messages`, {
      method: "POST",
      body: { body },
    });
    expect(created.status).toBe(201);

    const list = await client.request(`/api/bff/tickets/${ticketId}/messages`);
    expect(list.status).toBe(200);
    const messages = (await list.json()) as Array<{ id: number; body: string }>;
    expect(messages.some((m) => m.body === body)).toBe(true);
  });

  it("cierre del ticket → 200 y status closed", async () => {
    const res = await client.request(`/api/bff/tickets/${ticketId}/close`, { method: "POST" });
    expect(res.status).toBe(200);
    const data = (await res.json()) as Ticket;
    expect(data.status).toBe("closed");
  });

  it("validación: crear sin subject → 422", async () => {
    const res = await client.request("/api/bff/tickets", {
      method: "POST",
      body: { subject: "", description: "x" },
    });
    expect(res.status).toBe(422);
  });

  it("validación: PATCH sin cambios → 422", async () => {
    const res = await client.request(`/api/bff/tickets/${ticketId}`, {
      method: "PATCH",
      body: {},
    });
    expect(res.status).toBe(422);
  });

  it("validación: mensaje vacío → 422", async () => {
    const res = await client.request(`/api/bff/tickets/${ticketId}/messages`, {
      method: "POST",
      body: { body: " " },
    });
    expect(res.status).toBe(422);
  });
});
