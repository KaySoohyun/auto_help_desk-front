"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { useSessionStore } from "@/stores/session.store";
import { ticketDetailKey, ticketMessagesKey } from "./queryKeys";
import type { TicketMessage } from "@/types/ticket.types";

export function useSendMessage(ticketId: number) {
  const queryClient = useQueryClient();
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);

  return useMutation({
    mutationFn: async (body: string) => {
      const message = await bffFetch<TicketMessage>(`/api/bff/tickets/${ticketId}/messages`, {
        method: "POST",
        body: { body },
      });
      return message;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ticketMessagesKey(tenantId, ticketId) });
      void queryClient.invalidateQueries({ queryKey: ticketDetailKey(tenantId, ticketId) });
      void queryClient.invalidateQueries({ queryKey: ["tenant", tenantId, "tickets"] });
    },
  });
}
