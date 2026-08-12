"use client";

import { useQuery } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { useSessionStore } from "@/stores/session.store";
import { articleListKey } from "./queryKeys";
import type { KbArticleList, KbArticleListQuery } from "@/types/knowledge.types";

export function useArticles(query: KbArticleListQuery) {
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);

  return useQuery({
    queryKey: articleListKey(tenantId, query),
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams();
      if (query.status) params.set("status", query.status);
      if (query.category) params.set("category", query.category);
      if (query.tag) params.set("tag", query.tag);
      if (query.search) params.set("search", query.search);
      params.set("limit", String(query.limit ?? 50));
      params.set("offset", String(query.offset ?? 0));

      return bffFetch<KbArticleList>(`/api/bff/knowledge/articles?${params.toString()}`, {
        signal,
      });
    },
  });
}
