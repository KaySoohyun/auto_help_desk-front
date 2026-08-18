import type { UserRole } from "@/types/auth.types";

export const DEMO_PASSWORD = "demo-pass-123";

export interface DemoUser {
  role: UserRole;
  email: string;
  password: string;
  /** Si está definido, se incluye como tenant_id en el login; plataforma entra sin tenant. */
  tenantScoped?: boolean;
}

/** Usuarios demo compartidos (membresía en todos los tenants). Corre con `scripts/seed_demo_users.py`. */
export const DEMO_SUPPORT_USERS: DemoUser[] = [
  { role: "agent", email: "demo.agente@example.com", password: DEMO_PASSWORD, tenantScoped: true },
  { role: "supervisor", email: "demo.supervisor@example.com", password: DEMO_PASSWORD, tenantScoped: true },
  { role: "tenant_admin", email: "demo.admin@example.com", password: DEMO_PASSWORD, tenantScoped: true },
  { role: "platform_admin", email: "demo.plataforma@example.com", password: DEMO_PASSWORD, tenantScoped: false },
];

/** Email del usuario cliente demo de un tenant (el seed lo crea como `demo.cliente.<slug>@example.com`). */
export function demoCustomerEmail(slug: string): string {
  return `demo.cliente.${slug}@example.com`;
}
