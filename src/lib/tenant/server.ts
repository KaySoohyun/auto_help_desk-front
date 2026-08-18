import { fastApiFetch } from "@/lib/api/fastapi";
import type { Tenant } from "@/types/tenant.types";

/** Obtiene las empresas/tenants públicos desde el backend (Server Components / Route Handlers). */
export async function getPublicTenants(): Promise<Tenant[]> {
  return fastApiFetch<Tenant[]>("/v1/tenants/public");
}

/** Resuelve un tenant a partir de su slug, o `null` si no existe. */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const tenants = await getPublicTenants();
  return tenants.find((t) => t.slug === slug) ?? null;
}
