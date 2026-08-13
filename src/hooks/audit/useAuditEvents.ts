"use client";

import { useQuery } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { toAuditQueryString } from "@/lib/audit";
import { useSessionStore } from "@/stores/session.store";
import { auditEventsKey } from "./queryKeys";
import type { AuditEvent, AuditEventListQuery } from "@/types/audit.types";

export function useAuditEvents(query: AuditEventListQuery) {
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);

  return useQuery({
    queryKey: auditEventsKey(tenantId, query),
    queryFn: ({ signal }) =>
      bffFetch<AuditEvent[]>(`/api/bff/audit/events?${toAuditQueryString(query)}`, { signal }),
  });
}
