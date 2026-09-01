"use client";

import { useQuery } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { useSessionStore } from "@/stores/session.store";
import { adminUsersKey } from "./queryKeys";
import type { AdminUserList, AdminUserListQuery } from "@/types/admin.types";

export function useAdminUsers(query: AdminUserListQuery = {}) {
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);

  return useQuery({
    queryKey: adminUsersKey(tenantId, query),
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({
        limit: String(query.limit ?? 50),
        offset: String(query.offset ?? 0),
      });
      if (query.q) params.set("q", query.q);
      if (query.role && query.role !== "all") params.set("role", query.role);
      return bffFetch<AdminUserList>(`/api/bff/admin/users?${params.toString()}`, { signal });
    },
  });
}