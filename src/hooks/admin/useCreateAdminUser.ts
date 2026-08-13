"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { useSessionStore } from "@/stores/session.store";
import type { AdminUser, AdminUserCreatePayload } from "@/types/admin.types";

export function useCreateAdminUser() {
  const queryClient = useQueryClient();
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);

  return useMutation({
    mutationFn: async (payload: AdminUserCreatePayload) =>
      bffFetch<AdminUser>("/api/bff/admin/users", {
        method: "POST",
        body: payload,
      }),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ["tenant", tenantId, "admin", "users"] });
      return created;
    },
  });
}
