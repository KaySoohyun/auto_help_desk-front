"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import type { Ticket, TicketList, TicketListQuery, TicketMessage } from "@/types/ticket.types";
import { myMessagesKey, myTicketKey, myTicketsKey } from "./queryKeys";

export function useMyTickets(query: TicketListQuery = {}) {
  return useQuery({
    queryKey: myTicketsKey(query),
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams();
      if (query.status) params.set("status", query.status);
      if (query.category) params.set("category", query.category);
      if (query.priority) params.set("priority", query.priority);
      if (query.q) params.set("q", query.q);
      params.set("limit", String(query.limit ?? 100));
      params.set("offset", String(query.offset ?? 0));
      return bffFetch<TicketList>(`/api/bff/me/tickets?${params.toString()}`, { signal });
    },
  });
}

export function useMyTicket(ticketId: number) {
  return useQuery({
    queryKey: myTicketKey(ticketId),
    queryFn: ({ signal }) => bffFetch<Ticket>(`/api/bff/me/tickets/${ticketId}`, { signal }),
    enabled: Number.isInteger(ticketId) && ticketId > 0,
  });
}

export function useMyMessages(ticketId: number) {
  return useQuery({
    queryKey: myMessagesKey(ticketId),
    queryFn: ({ signal }) =>
      bffFetch<TicketMessage[]>(`/api/bff/me/tickets/${ticketId}/messages`, { signal }),
    enabled: Number.isInteger(ticketId) && ticketId > 0,
  });
}

export function useSendMyMessage(ticketId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      bffFetch<TicketMessage>(`/api/bff/me/tickets/${ticketId}/messages`, {
        method: "POST",
        body: { body },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: myMessagesKey(ticketId) });
    },
  });
}

export function useCreateMyTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { subject: string; description: string; category?: string; priority?: string }) =>
      bffFetch<Ticket>("/api/bff/me/tickets", { method: "POST", body: payload }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: myTicketsKey() });
    },
  });
}
