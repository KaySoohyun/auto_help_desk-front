import { describe, it, expect, beforeAll } from "vitest";
import { TestClient, seedAgent, type SeedUser } from "./support/client";

interface Ticket {
  id: number;
  subject: string;
  status: string;
  priority: string | null;
  assignee_id: number | null;
}

interface TicketList {
  items: Ticket[];
  total: number;
  limit: number;
  offset: number;
}

const UNIQUE = `dash-${Date.now()}`;

describe("dashboard", () => {
  const client = new TestClient();
  let agent: SeedUser;
  let assignedTicketId = 0;

  beforeAll(async () => {
    agent = await seedAgent();
    const login = await client.loginWith(agent);
    expect(login.status).toBe(200);
  });

  it("query del dashboard (limit=100, offset=0) → 200 con shape correcto", async () => {
    const res = await client.request("/api/bff/tickets?limit=100&offset=0");
    expect(res.status).toBe(200);
    const data = (await res.json()) as TicketList;
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.limit).toBe(100);
    expect(data.offset).toBe(0);
    expect(data.total).toBe(data.items.length);
  });

  it("siembra: ticket asignado al agente + ticket sin asignar", async () => {
    const created = await client.request("/api/bff/tickets", {
      method: "POST",
      body: { subject: `Dashboard asignado ${UNIQUE}`, description: "test", priority: "high" },
    });
    expect(created.status).toBe(201);
    assignedTicketId = ((await created.json()) as Ticket).id;

    const assigned = await client.request(`/api/bff/tickets/${assignedTicketId}`, {
      method: "PATCH",
      body: { assignee_id: agent.id },
    });
    expect(assigned.status).toBe(200);
    expect(((await assigned.json()) as Ticket).assignee_id).toBe(agent.id);

    const unassigned = await client.request("/api/bff/tickets", {
      method: "POST",
      body: { subject: `Dashboard sin asignar ${UNIQUE}`, description: "test", priority: "medium" },
    });
    expect(unassigned.status).toBe(201);
  });

  it("KPIs derivables: asignados a mí, sin asignar y abiertos", async () => {
    const res = await client.request("/api/bff/tickets?limit=100&offset=0");
    expect(res.status).toBe(200);
    const { items } = (await res.json()) as TicketList;

    const asignadosAMi = items.filter((t) => t.assignee_id === agent.id).length;
    const sinAsignar = items.filter((t) => t.assignee_id === null).length;
    const abiertos = items.filter((t) => t.status !== "closed").length;

    expect(asignadosAMi).toBeGreaterThanOrEqual(1);
    expect(sinAsignar).toBeGreaterThanOrEqual(1);
    expect(abiertos).toBeGreaterThanOrEqual(2);
  });

  it("filtro status=open devuelve solo tickets abiertos", async () => {
    const res = await client.request("/api/bff/tickets?status=open&limit=100");
    expect(res.status).toBe(200);
    const { items } = (await res.json()) as TicketList;
    expect(items.length).toBeGreaterThanOrEqual(2);
    for (const t of items) expect(t.status).toBe("open");
  });

  it("filtro priority=high devuelve solo tickets high/urgent según backend", async () => {
    const res = await client.request("/api/bff/tickets?priority=high&limit=100");
    expect(res.status).toBe(200);
    const { items } = (await res.json()) as TicketList;
    expect(items.length).toBeGreaterThanOrEqual(1);
    for (const t of items) expect(t.priority).toBe("high");
  });

  it("filtros combinados status=open + priority=high", async () => {
    const res = await client.request("/api/bff/tickets?status=open&priority=high&limit=100");
    expect(res.status).toBe(200);
    const { items } = (await res.json()) as TicketList;
    expect(items.length).toBeGreaterThanOrEqual(1);
    for (const t of items) {
      expect(t.status).toBe("open");
      expect(t.priority).toBe("high");
    }
  });
});
