"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { useSessionStore } from "@/stores/session.store";
import { adminUsersKey } from "./queryKeys";
import type { AdminUser, AdminUserUpdatePayload } from "@/types/admin.types";

export function useUpdateAdminUser(userId: number) {
  const queryClient = useQueryClient();
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);

  return useMutation({
    mutationFn: async (payload: AdminUserUpdatePayload) =>
      bffFetch<AdminUser>(`/api/bff/admin/users/${userId}`, {
        method: "PATCH",
        body: payload,
      }),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: adminUsersKey(tenantId, {}) });
      void queryClient.invalidateQueries({ queryKey: ["tenant", tenantId, "admin", "users"] });
      return updated;
    },
  });
}
