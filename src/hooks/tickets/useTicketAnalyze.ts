"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { useSessionStore } from "@/stores/session.store";
import { ticketAnalyzeKey } from "../tickets/queryKeys";
import type { LlmAnalyzeOutput } from "@/types/llm.types";

export function useTicketAnalyze(ticketId: number | null) {
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      bffFetch<LlmAnalyzeOutput>(`/api/bff/tickets/${ticketId}/analyze`, {
        method: "POST",
      }),
    onSuccess: () => {
      if (ticketId) {
        queryClient.invalidateQueries({ queryKey: ticketAnalyzeKey(tenantId, ticketId) });
      }
    },
  });
}
