import type { AdminUserListQuery } from "@/types/admin.types";

export function adminUsersKey(tenantId: string | null, query: AdminUserListQuery) {
  return ["tenant", tenantId ?? "global", "admin", "users", query] as const;
}

export function adminAiPolicyKey(tenantId: string | null) {
  return ["tenant", tenantId ?? "global", "admin", "ai-policy"] as const;
}

export function adminGlobalAiPolicyKey(tenantId: string | null) {
  return ["tenant", tenantId ?? "global", "admin", "ai-policies/global"] as const;
}

export function adminAiInfoKey(tenantId: string | null) {
  return ["tenant", tenantId ?? "global", "admin", "ai-info"] as const;
}

export function adminCustomersKey(
  tenantId: string | null,
  filterTenantId: string | null = null,
  q = "",
  offset = 0,
) {
  return ["tenant", tenantId ?? "global", "admin", "customers", filterTenantId ?? "all", q, offset] as const;
}
