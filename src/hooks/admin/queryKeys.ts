import type { AdminUserListQuery } from "@/types/admin.types";

export function adminUsersKey(tenantId: string | null, query: AdminUserListQuery) {
  return ["tenant", tenantId ?? "global", "admin", "users", query] as const;
}
