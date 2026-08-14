"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { useSessionStore } from "@/stores/session.store";
import { ticketTagsKey } from "./queryKeys";

interface AddTicketTagPayload {
  ticketId: number;
  tagId: number;
}

export function useAddTicketTag() {
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, tagId }: AddTicketTagPayload) =>
      bffFetch<{ ticket_id: number; tag_id: number; tag_name: string }>(
        `/api/bff/tickets/${ticketId}/tags/add`,
        {
          method: "POST",
          body: { tag_id: tagId },
        }
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ticketTagsKey(tenantId, variables.ticketId) });
    },
  });
}
