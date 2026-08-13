"use client";

import { useQuery } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { useSessionStore } from "@/stores/session.store";
import { adminAiInfoKey } from "./queryKeys";
import type { OrchestratorInfo } from "@/types/admin.types";

export function useAiInfo() {
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);

  return useQuery({
    queryKey: adminAiInfoKey(tenantId),
    queryFn: ({ signal }) => bffFetch<OrchestratorInfo>("/api/bff/admin/ai-info", { signal }),
  });
}
