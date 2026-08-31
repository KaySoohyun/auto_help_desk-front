"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { useSessionStore } from "@/stores/session.store";
import type { Tag } from "@/types/tag.types";

interface CreateTagPayload {
  name: string;
}

export function useCreateTag() {
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name }: CreateTagPayload) =>
      bffFetch<Tag>("/api/bff/tags", {
        method: "POST",
        body: { name },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tenant", tenantId ?? "global", "tags"],
      });
    },
  });
}
