import type { AuditEventListQuery } from "@/types/audit.types";

export function auditEventsKey(tenantId: string | null, query: AuditEventListQuery) {
  return ["tenant", tenantId ?? "global", "audit", "events", query] as const;
}
