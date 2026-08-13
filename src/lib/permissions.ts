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

export type KbPermission = "kb:read" | "kb:edit" | "kb:publish";

const KB_ROLE_PERMISSIONS: Record<UserRole, KbPermission[]> = {
  platform_admin: ["kb:read", "kb:edit", "kb:publish"],
  tenant_admin: ["kb:read", "kb:edit", "kb:publish"],
  supervisor: ["kb:read", "kb:edit", "kb:publish"],
  agent: ["kb:read"],
};

export function hasKbPermission(role: UserRole | null, permission: KbPermission): boolean {
  if (!role) return false;
  return KB_ROLE_PERMISSIONS[role].includes(permission);
}

export type AdminPermission = "users:read" | "users:edit";

const ADMIN_ROLE_PERMISSIONS: Record<UserRole, AdminPermission[]> = {
  platform_admin: ["users:read", "users:edit"],
  tenant_admin: ["users:read", "users:edit"],
  supervisor: [],
  agent: [],
};

export function hasAdminPermission(role: UserRole | null, permission: AdminPermission): boolean {
  if (!role) return false;
  return ADMIN_ROLE_PERMISSIONS[role].includes(permission);
}
