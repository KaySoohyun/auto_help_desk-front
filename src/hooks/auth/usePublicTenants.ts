"use client";

import { useQuery } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import type { Tenant } from "@/types/tenant.types";

export function usePublicTenants() {
  return useQuery({
    queryKey: ["public", "tenants"],
    queryFn: async ({ signal }) =>
      bffFetch<Tenant[]>("/api/bff/tenants/public", { signal }),
  });
}
