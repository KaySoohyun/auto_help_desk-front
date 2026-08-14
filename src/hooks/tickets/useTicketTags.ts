"use client";

import { useQuery } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { useSessionStore } from "@/stores/session.store";
import { ticketTagsKey } from "./queryKeys";
import type { Tag } from "@/types/tag.types";

export function useTicketTags(ticketId: number | null) {
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);

  return useQuery({
    queryKey: ticketTagsKey(tenantId, ticketId ?? 0),
    queryFn: ({ signal }) =>
      bffFetch<Tag[]>(`/api/bff/tickets/${ticketId}/tags`, { signal }),
    enabled: ticketId !== null,
  });
}
