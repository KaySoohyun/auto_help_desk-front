"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { useSessionStore } from "@/stores/session.store";
import type { KbArticle } from "@/types/knowledge.types";

export function usePublishArticle(articleId: number) {
  const queryClient = useQueryClient();
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);

  return useMutation({
    mutationFn: async () =>
      bffFetch<KbArticle>(`/api/bff/knowledge/articles/${articleId}/publish`, {
        method: "POST",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tenant", tenantId, "knowledge"] });
    },
  });
}
