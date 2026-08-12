"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { useSessionStore } from "@/stores/session.store";
import { articleDetailKey } from "./queryKeys";
import type { KbArticle, KbArticleUpdatePayload } from "@/types/knowledge.types";

export function useUpdateArticle(articleId: number) {
  const queryClient = useQueryClient();
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);

  return useMutation({
    mutationFn: async (payload: KbArticleUpdatePayload) =>
      bffFetch<KbArticle>(`/api/bff/knowledge/articles/${articleId}`, {
        method: "PATCH",
        body: payload,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: articleDetailKey(tenantId, articleId) });
      void queryClient.invalidateQueries({ queryKey: ["tenant", tenantId, "knowledge"] });
    },
  });
}
