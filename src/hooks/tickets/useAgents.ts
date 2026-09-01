"use client";

import { useQuery } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { useSessionStore } from "@/stores/session.store";
import type { Agent } from "@/types/agent.types";

export function agentsKey(tenantId: string | null) {
  return ["tenant", tenantId ?? "global", "agents"] as const;
}

/** Agentes activos del tenant efectivo, para el selector de asignación. */
export function useAgents() {
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);

  return useQuery({
    queryKey: agentsKey(tenantId),
    queryFn: ({ signal }) => bffFetch<Agent[]>("/api/bff/agents", { signal }),
    staleTime: 60_000,
  });
}