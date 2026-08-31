"use client";

import { useQuery } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { useSessionStore } from "@/stores/session.store";
import { ticketSuggestionsKey } from "./queryKeys";
import type { SuggestionRecord } from "@/types/llm.types";

export function useTicketSuggestions(ticketId: number | null) {
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);

  return useQuery({
    queryKey: ticketSuggestionsKey(tenantId, ticketId ?? 0),
    queryFn: ({ signal }) =>
      bffFetch<SuggestionRecord[]>(`/api/bff/tickets/${ticketId}/suggestions`, { signal }),
    enabled: ticketId !== null,
  });
}
