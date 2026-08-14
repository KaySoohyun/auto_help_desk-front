import { describe, it, expect } from "vitest";
import { TestClient, backendUrl } from "./support/client";

interface TenantOut {
  id: string;
  name: string;
  slug: string;
}

interface UserOut {
  id: number;
  email: string;
  tenant_id: string | null;
  tenants: Array<{ id: string; name: string; role: string }>;
}

interface DashboardKpis {
  ticketsAsignadosAMi: number;
  ticketsAbiertos: number;
  ticketsSinAsignar: number;
  ticketsSLAEnRiesgo: number;
}

/** Registra un usuario único vía el BFF y devuelve el cliente con la sesión activa. */
async function registerViaBff(tenantIds: string[]): Promise<{ client: TestClient; email: string; user: UserOut }> {
  const email = `empresa-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  const client = new TestClient();
  const res = await client.request("/api/bff/auth/register", {
    method: "POST",
    body: { email, password: "empresa-pass-123", tenant_ids: tenantIds },
  });
  expect(res.status).toBe(201);
  const body = (await res.json()) as { user: UserOut };
  return { client, email, user: body.user };
}

describe("portal empresas (multi-tenant)", () => {
  it("GET /api/bff/tenants/public → lista tenants disponibles", async () => {
    const client = new TestClient();
    const res = await client.request("/api/bff/tenants/public", { withCsrf: false });
    expect(res.status).toBe(200);
    const data = (await res.json()) as TenantOut[];
    expect(data.length).toBeGreaterThanOrEqual(2);
    expect(data[0]).toHaveProperty("id");
    expect(data[0]).toHaveProperty("name");
  });

  it("registro con varios tenants → 201, sesión activa y tenants asociados", async () => {
    const client = new TestClient();
    const tenantsRes = await client.request("/api/bff/tenants/public", { withCsrf: false });
    const tenants = (await tenantsRes.json()) as TenantOut[];
    const ids = tenants.slice(0, 2).map((t) => t.id);

    const { client: session, user } = await registerViaBff(ids);
    expect(user.tenant_id).toBeNull(); // sin tenant activo → ve todos
    expect(user.tenants.map((t) => t.id).sort()).toEqual([...ids].sort());

    const me = await session.request("/api/bff/me");
    expect(me.status).toBe(200);
  });

  it("dashboard funcional después del registro (todos los tenants)", async () => {
    const client = new TestClient();
    const tenantsRes = await client.request("/api/bff/tenants/public", { withCsrf: false });
    const tenants = (await tenantsRes.json()) as TenantOut[];
    const { client: session, user } = await registerViaBff(tenants.slice(0, 2).map((t) => t.id));
    expect(user.tenants.length).toBe(2);

    const res = await session.request("/api/bff/dashboard");
    expect(res.status).toBe(200);
    const kpis = (await res.json()) as DashboardKpis;
    expect(typeof kpis.ticketsAsignadosAMi).toBe("number");
    expect(typeof kpis.ticketsAbiertos).toBe("number");
    expect(typeof kpis.ticketsSinAsignar).toBe("number");
    expect(typeof kpis.ticketsSLAEnRiesgo).toBe("number");
  });

  it("switch-tenant → me refleja el tenant activo; clear-tenant → vuelve a todos", async () => {
    const client = new TestClient();
    const tenantsRes = await client.request("/api/bff/tenants/public", { withCsrf: false });
    const tenants = (await tenantsRes.json()) as TenantOut[];
    const [t1, t2] = tenants.slice(0, 2);

    const { client: session } = await registerViaBff([t1.id, t2.id]);

    const switchRes = await session.request("/api/bff/auth/switch-tenant", {
      method: "POST",
      body: { tenant_id: t1.id },
    });
    expect(switchRes.status).toBe(200);
    let me = ((await (await session.request("/api/bff/me")).json()) as { user: UserOut }).user;
    expect(me.tenant_id).toBe(t1.id);

    const clearRes = await session.request("/api/bff/auth/clear-tenant", { method: "POST" });
    expect(clearRes.status).toBe(200);
    me = ((await (await session.request("/api/bff/me")).json()) as { user: UserOut }).user;
    expect(me.tenant_id).toBeNull();
  });
});

describe("smoke: backendUrl apunta al backend local", () => {
  it("el backend responde /health", async () => {
    const res = await fetch(`${backendUrl()}/health`);
    expect(res.status).toBe(200);
  });
});
