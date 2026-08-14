"use client";

import { useQuery } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { useSessionStore } from "@/stores/session.store";
import { customerKey } from "../tickets/queryKeys";
import type { Customer } from "@/types/customer.types";

export function useCustomer(customerId: number | null) {
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);

  return useQuery({
    queryKey: customerKey(tenantId, customerId ?? 0),
    queryFn: ({ signal }) =>
      bffFetch<Customer>(`/api/bff/customers/${customerId}`, { signal }),
    enabled: customerId !== null,
  });
}
