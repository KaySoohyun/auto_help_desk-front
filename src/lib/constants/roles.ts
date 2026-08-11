import type { UserRole } from "@/types/auth.types";

export const ROLE_LABELS: Record<UserRole, string> = {
  platform_admin: "Administrador de plataforma",
  tenant_admin: "Administrador de tenant",
  supervisor: "Supervisor",
  agent: "Agente",
};
