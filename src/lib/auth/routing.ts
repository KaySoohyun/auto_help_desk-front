import type { UserRole } from "@/types/auth.types";

/** Ruta inicial según el rol: cliente → portal de personas, resto → app de agente/empresa. */
export function homePathForRole(role: UserRole): string {
  return role === "customer" ? "/panel" : "/app";
}
