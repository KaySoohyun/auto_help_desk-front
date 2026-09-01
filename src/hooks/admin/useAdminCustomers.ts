"use client";

import { useQuery } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { useSessionStore } from "@/stores/session.store";
import { adminCustomersKey } from "./queryKeys";
import type { AdminCustomerList } from "@/types/admin.types";

export interface AdminCustomerListQuery {
  tenantId: string | null;
  q?: string;
  limit?: number;
  offset?: number;
}

export function useAdminCustomers(query: AdminCustomerListQuery = { tenantId: null }) {
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);

  return useQuery({
    queryKey: adminCustomersKey(tenantId, query.tenantId, query.q ?? "", query.offset ?? 0),
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({
        limit: String(query.limit ?? 50),
        offset: String(query.offset ?? 0),
      });
      if (query.tenantId) params.set("tenant_id", query.tenantId);
      if (query.q) params.set("q", query.q);
      return bffFetch<AdminCustomerList>(`/api/bff/admin/customers?${params.toString()}`, { signal });
    },
  });
}