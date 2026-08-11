"use client";

import { useQuery } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { useSessionStore } from "@/stores/session.store";
import { ticketDetailKey } from "./queryKeys";
import type { Ticket } from "@/types/ticket.types";

export function useTicket(ticketId: number | null) {
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);

  return useQuery({
    queryKey: ticketDetailKey(tenantId, ticketId ?? 0),
    queryFn: ({ signal }) =>
      bffFetch<Ticket>(`/api/bff/tickets/${ticketId}`, { signal }),
    enabled: ticketId !== null,
  });
}
