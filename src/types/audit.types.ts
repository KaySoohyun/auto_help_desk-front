export type AuditEventResult = "success" | "failure" | "disabled" | (string & {});

export type AuditEventService = "auth" | "tickets" | "admin" | "ai" | "audit" | "pii" | (string & {});

export interface AuditEvent {
  id: number;
  created_at: string;
  tenant_id: string | null;
  user_id: number | null;
  action: string;
  service: AuditEventService | null;
  model: string | null;
  model_version: string | null;
  prompt_version: string | null;
  trace_id: string | null;
  result: AuditEventResult;
  confidence: number | null;
  detail: Record<string, unknown> | null;
}

export interface AuditEventListQuery {
  action?: string;
  service?: AuditEventService;
  user_id?: number;
  result?: AuditEventResult;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}
