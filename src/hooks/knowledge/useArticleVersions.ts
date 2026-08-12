"use client";

import { useQuery } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { useSessionStore } from "@/stores/session.store";
import { articleVersionsKey } from "./queryKeys";
import type { KbArticleVersion } from "@/types/knowledge.types";

export function useArticleVersions(articleId: number | null) {
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);

  return useQuery({
    queryKey: articleVersionsKey(tenantId, articleId ?? 0),
    queryFn: ({ signal }) =>
      bffFetch<KbArticleVersion[]>(`/api/bff/knowledge/articles/${articleId}/versions`, { signal }),
    enabled: articleId !== null,
  });
}
