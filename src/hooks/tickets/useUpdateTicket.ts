"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { useSessionStore } from "@/stores/session.store";
import { ticketDetailKey } from "./queryKeys";
import type { Ticket, TicketUpdatePayload } from "@/types/ticket.types";

export function useUpdateTicket(ticketId: number) {
  const queryClient = useQueryClient();
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);

  return useMutation({
    mutationFn: async (payload: TicketUpdatePayload) =>
      bffFetch<Ticket>(`/api/bff/tickets/${ticketId}`, {
        method: "PATCH",
        body: payload,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ticketDetailKey(tenantId, ticketId) });
      void queryClient.invalidateQueries({ queryKey: ["tenant", tenantId, "tickets"] });
    },
  });
}
