import type { UserRole } from "@/types/auth.types";

/** Ruta inicial según el rol: cliente → portal de personas, resto → app de agente/empresa. */
export function homePathForRole(role: UserRole, slug: string): string {
  return `/${slug}/${role === "customer" ? "panel" : "app"}`;
}
