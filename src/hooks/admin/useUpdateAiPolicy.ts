"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { useSessionStore } from "@/stores/session.store";
import { adminAiPolicyKey } from "./queryKeys";
import type { AdminAiPolicy, AdminAiPolicyUpdate } from "@/types/admin.types";

export function useUpdateAiPolicy() {
  const queryClient = useQueryClient();
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);

  return useMutation({
    mutationFn: (payload: AdminAiPolicyUpdate) =>
      bffFetch<AdminAiPolicy>("/api/bff/admin/ai-policy", { method: "PUT", body: payload }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminAiPolicyKey(tenantId) });
    },
  });
}
