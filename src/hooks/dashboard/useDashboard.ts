"use client";

import { useQuery } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { useSessionStore } from "@/stores/session.store";
import type { DashboardKpis, DashboardFilters } from "@/types/dashboard.types";

export function useDashboard(filters: DashboardFilters = {}) {
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);

  return useQuery({
    queryKey: ["tenant", tenantId ?? "global", "dashboard", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      if (filters.priority) params.set("priority", filters.priority);
      params.set("limit", "100");
      params.set("offset", "0");

      return bffFetch<DashboardKpis>(`/api/bff/tickets?${params.toString()}`);
    },
  });
}