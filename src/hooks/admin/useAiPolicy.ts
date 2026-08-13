"use client";

import { useQuery } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { useSessionStore } from "@/stores/session.store";
import { adminAiPolicyKey } from "./queryKeys";
import type { AdminAiPolicy } from "@/types/admin.types";

export function useAiPolicy() {
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);

  return useQuery({
    queryKey: adminAiPolicyKey(tenantId),
    queryFn: ({ signal }) => bffFetch<AdminAiPolicy>("/api/bff/admin/ai-policy", { signal }),
  });
}
