"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { useSessionStore } from "@/stores/session.store";
import { ticketTagsKey } from "./queryKeys";

interface RemoveTicketTagPayload {
  ticketId: number;
  tagId: number;
}

export function useRemoveTicketTag() {
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, tagId }: RemoveTicketTagPayload) =>
      bffFetch<void>(`/api/bff/tickets/${ticketId}/tags/${tagId}`, {
        method: "DELETE",
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ticketTagsKey(tenantId, variables.ticketId) });
    },
  });
}
