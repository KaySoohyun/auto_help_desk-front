"use client";

import { useQuery } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { useSessionStore } from "@/stores/session.store";
import { ticketListKey } from "./queryKeys";
import type { TicketList, TicketListQuery } from "@/types/ticket.types";

export function useTickets(query: TicketListQuery) {
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);

  return useQuery({
    queryKey: ticketListKey(tenantId, query),
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams();
      if (query.status) params.set("status", query.status);
      if (query.category) params.set("category", query.category);
      if (query.priority) params.set("priority", query.priority);
      if (query.assignee_id !== undefined) params.set("assignee_id", String(query.assignee_id));
      if (query.date_from) params.set("date_from", query.date_from);
      if (query.date_to) params.set("date_to", query.date_to);
      params.set("limit", String(query.limit ?? 50));
      params.set("offset", String(query.offset ?? 0));

      return bffFetch<TicketList>(`/api/bff/tickets?${params.toString()}`, { signal });
    },
  });
}
