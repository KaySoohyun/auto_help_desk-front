"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { useSessionStore } from "@/stores/session.store";
import { adminGlobalAiPolicyKey } from "./queryKeys";
import type { GlobalAiPolicy, GlobalAiPolicyUpdate } from "@/types/admin.types";

export function useUpdateGlobalAiPolicy() {
  const queryClient = useQueryClient();
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);

  return useMutation({
    mutationFn: (payload: GlobalAiPolicyUpdate) =>
      bffFetch<GlobalAiPolicy>("/api/bff/admin/ai-policies/global", {
        method: "PUT",
        body: payload,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminGlobalAiPolicyKey(tenantId) });
    },
  });
}
