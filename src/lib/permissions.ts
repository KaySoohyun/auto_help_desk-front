import type { UserRole } from "@/types/auth.types";

export type TicketPermission =
  | "tickets:read"
  | "responses:edit"
  | "responses:send"
  | "ai:suggest";

const ROLE_PERMISSIONS: Record<UserRole, TicketPermission[]> = {
  platform_admin: ["tickets:read"],
  tenant_admin: ["tickets:read", "responses:edit", "responses:send", "ai:suggest"],
  supervisor: ["tickets:read", "responses:edit", "responses:send", "ai:suggest"],
  agent: ["tickets:read", "responses:edit", "responses:send", "ai:suggest"],
};

export function hasTicketPermission(role: UserRole | null, permission: TicketPermission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}
