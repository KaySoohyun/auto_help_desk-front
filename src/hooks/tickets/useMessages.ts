"use client";

import { useQuery } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { useSessionStore } from "@/stores/session.store";
import { ticketMessagesKey } from "./queryKeys";
import type { TicketMessage } from "@/types/ticket.types";

export function useMessages(ticketId: number | null) {
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);

  return useQuery({
    queryKey: ticketMessagesKey(tenantId, ticketId ?? 0),
    queryFn: ({ signal }) =>
      bffFetch<TicketMessage[]>(`/api/bff/tickets/${ticketId}/messages`, { signal }),
    enabled: ticketId !== null,
  });
}
