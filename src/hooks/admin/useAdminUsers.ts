"use client";

import { useQuery } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { useSessionStore } from "@/stores/session.store";
import { adminUsersKey } from "./queryKeys";
import type { AdminUser, AdminUserListQuery } from "@/types/admin.types";

export function useAdminUsers(query: AdminUserListQuery = {}) {
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);

  return useQuery({
    queryKey: adminUsersKey(tenantId, query),
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({
        limit: String(query.limit ?? 200),
        offset: String(query.offset ?? 0),
      });
      return bffFetch<AdminUser[]>(`/api/bff/admin/users?${params.toString()}`, {
        signal,
      });
    },
  });
}
