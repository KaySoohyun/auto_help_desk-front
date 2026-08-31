"use client";

import { useQuery } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { useSessionStore } from "@/stores/session.store";
import type { Tag } from "@/types/tag.types";

export function tagsSearchKey(tenantId: string | null, search: string) {
  return ["tenant", tenantId ?? "global", "tags", "search", search] as const;
}

export function useTags(search: string) {
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);
  const trimmed = search.trim();

  return useQuery({
    queryKey: tagsSearchKey(tenantId, trimmed),
    queryFn: ({ signal }) => {
      const qs = new URLSearchParams();
      if (trimmed) qs.set("search", trimmed);
      return bffFetch<Tag[]>(`/api/bff/tags?${qs.toString()}`, { signal });
    },
    enabled: trimmed.length >= 3,
    staleTime: 60_000,
  });
}
