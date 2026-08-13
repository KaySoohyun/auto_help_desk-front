import type { UserRole } from "@/types/auth.types";

export const ROLE_LABELS: Record<UserRole, string> = {
  platform_admin: "Admin de plataforma",
  tenant_admin: "Admin de tenant",
  supervisor: "Supervisor",
  agent: "Agente",
};

export const ROLE_ORDER: UserRole[] = ["tenant_admin", "supervisor", "agent", "platform_admin"];
