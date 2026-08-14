"use client";

import { useQuery } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { useSessionStore } from "@/stores/session.store";
import type { DashboardKpis, DashboardFilters } from "@/types/dashboard.types";

export function useDashboard(filters: DashboardFilters = {}) {
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);

  return useQuery({
    queryKey: ["tenant", tenantId ?? "global", "dashboard", filters],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      if (filters.priority) params.set("priority", filters.priority);

      const qs = params.toString();
      return bffFetch<DashboardKpis>(`/api/bff/dashboard${qs ? `?${qs}` : ""}`, { signal });
    },
  });
}
