"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { useSessionStore } from "@/stores/session.store";
import type { CreateTicketPayload, Ticket } from "@/types/ticket.types";

export function useCreateTicket() {
  const queryClient = useQueryClient();
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);

  return useMutation({
    mutationFn: async (payload: CreateTicketPayload) =>
      bffFetch<Ticket>("/api/bff/tickets", {
        method: "POST",
        body: payload,
      }),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ["tenant", tenantId, "tickets"] });
      return created;
    },
  });
}
