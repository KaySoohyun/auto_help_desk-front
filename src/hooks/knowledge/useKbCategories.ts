"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import type { KbCategory } from "@/types/knowledge.types";

export function useKbCategories() {
  return useQuery({
    queryKey: ["knowledge", "categories"],
    queryFn: ({ signal }) => bffFetch<KbCategory[]>("/api/bff/knowledge/categories", { signal }),
  });
}

export function useCreateKbCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      bffFetch<KbCategory>("/api/bff/knowledge/categories", {
        method: "POST",
        body: { name },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["knowledge", "categories"] });
    },
  });
}
