"use client";

import { useQuery } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { useSessionStore } from "@/stores/session.store";
import { articleDetailKey } from "./queryKeys";
import type { KbArticle } from "@/types/knowledge.types";

export function useArticle(articleId: number | null) {
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);

  return useQuery({
    queryKey: articleDetailKey(tenantId, articleId ?? 0),
    queryFn: ({ signal }) =>
      bffFetch<KbArticle>(`/api/bff/knowledge/articles/${articleId}`, { signal }),
    enabled: articleId !== null,
  });
}
