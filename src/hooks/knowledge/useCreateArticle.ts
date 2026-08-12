"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { useSessionStore } from "@/stores/session.store";
import type { KbArticle, KbArticleCreatePayload } from "@/types/knowledge.types";

export function useCreateArticle() {
  const queryClient = useQueryClient();
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);

  return useMutation({
    mutationFn: async (payload: KbArticleCreatePayload) =>
      bffFetch<KbArticle>("/api/bff/knowledge/articles", {
        method: "POST",
        body: payload,
      }),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ["tenant", tenantId, "knowledge"] });
      return created;
    },
  });
}
