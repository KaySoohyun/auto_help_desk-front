import { describe, it, expect } from "vitest";
import { TestClient } from "./support/client";

interface TenantOut {
  id: string;
  name: string;
}

interface UserOut {
  id: number;
  email: string;
  role: string;
  tenants: Array<{ id: string; name: string; role: string }>;
}

interface PersonaProfile {
  id: number;
  name: string;
  email: string | null;
  company: string | null;
  tenant_id: string;
  tenant_name: string;
}

interface Ticket {
  id: number;
  subject: string;
  status: string;
  customer_id: number | null;
}

interface TicketList {
  items: Ticket[];
  total: number;
}

interface TicketMessage {
  id: number;
  author_id: number | null;
  body: string;
}

async function registerCustomer(): Promise<{ client: TestClient; email: string; user: UserOut }> {
  const probe = new TestClient();
  const tenantsRes = await probe.request("/api/bff/tenants/public", { withCsrf: false });
  const tenants = (await tenantsRes.json()) as TenantOut[];
  const tenantId = tenants[0].id;

  const email = `persona-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  const client = new TestClient();
  const res = await client.request("/api/bff/auth/register", {
    method: "POST",
    body: { email, password: "persona-pass-123", role: "customer", tenant_ids: [tenantId] },
  });
  expect(res.status).toBe(201);
  const body = (await res.json()) as { user: UserOut };
  return { client, email, user: body.user };
}

describe("portal personas (usuario final)", () => {
  it("registro customer + perfil", async () => {
    const { client, user } = await registerCustomer();
    expect(user.role).toBe("customer");
    expect(user.tenants.length).toBeGreaterThanOrEqual(1);

    const profileRes = await client.request("/api/bff/me/profile");
    expect(profileRes.status).toBe(200);
    const profile = (await profileRes.json()) as PersonaProfile;
    expect(profile.name).toBeTruthy();
    expect(profile.tenant_id).toBeTruthy();
  });

  it("crear ticket como cliente → aparece en mis tickets", async () => {
    const { client } = await registerCustomer();

    const createRes = await client.request("/api/bff/me/tickets", {
      method: "POST",
      body: { subject: "Problema persona", description: "Descripción", category: "billing", priority: "high" },
    });
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as Ticket;
    expect(created.customer_id).toBeGreaterThan(0);
    expect(created.status).toBe("open");

    const listRes = await client.request("/api/bff/me/tickets");
    expect(listRes.status).toBe(200);
    const list = (await listRes.json()) as TicketList;
    expect(list.total).toBeGreaterThanOrEqual(1);
    expect(list.items.some((t) => t.id === created.id)).toBe(true);
  });

  it("conversación: enviar y listar mensajes", async () => {
    const { client } = await registerCustomer();
    const created = ((await (await client.request("/api/bff/me/tickets", {
      method: "POST",
      body: { subject: "Conversación", description: "desc" },
    })).json()) as Ticket);

    const sent = await client.request(`/api/bff/me/tickets/${created.id}/messages`, {
      method: "POST",
      body: { body: "Hola, necesito ayuda con mi cuenta" },
    });
    expect(sent.status).toBe(201);

    const thread = await client.request(`/api/bff/me/tickets/${created.id}/messages`);
    expect(thread.status).toBe(200);
    const messages = (await thread.json()) as TicketMessage[];
    expect(messages.map((m) => m.body)).toContain("Hola, necesito ayuda con mi cuenta");
  });

  it("aislamiento: un cliente no ve los tickets de otro", async () => {
    const { client: clienteA } = await registerCustomer();
    const created = ((await (await clienteA.request("/api/bff/me/tickets", {
      method: "POST",
      body: { subject: "Ticket privado de A", description: "desc" },
    })).json()) as Ticket);

    const { client: clienteB } = await registerCustomer();
    const listB = await clienteB.request("/api/bff/me/tickets");
    const listData = (await listB.json()) as TicketList;
    expect(listData.items.some((t) => t.id === created.id)).toBe(false);

    const accessB = await clienteB.request(`/api/bff/me/tickets/${created.id}`);
    expect(accessB.status).toBe(404);
  });
});
