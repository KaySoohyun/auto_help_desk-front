"use client";

import { useQuery } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { tenantKey } from "../tickets/queryKeys";
import type { Tenant } from "@/types/tenant.types";

export function useTenant(tenantId: string | null) {
  return useQuery({
    queryKey: tenantKey(tenantId),
    queryFn: ({ signal }) =>
      bffFetch<Tenant>(`/api/bff/tenants/${tenantId}`, { signal }),
    enabled: tenantId !== null,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
