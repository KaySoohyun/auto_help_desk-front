"use client";

import { useQuery } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { useSessionStore } from "@/stores/session.store";
import { adminGlobalAiPolicyKey } from "./queryKeys";
import type { GlobalAiPolicy } from "@/types/admin.types";

export function useGlobalAiPolicy() {
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);

  return useQuery({
    queryKey: adminGlobalAiPolicyKey(tenantId),
    queryFn: ({ signal }) => bffFetch<GlobalAiPolicy>("/api/bff/admin/ai-policies/global", { signal }),
  });
}
