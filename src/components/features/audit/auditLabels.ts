import type { AuditEventResult, AuditEventService } from "@/types/audit.types";

export const SERVICE_LABELS: Record<AuditEventService, string> = {
  auth: "Autenticación",
  tickets: "Tickets",
  admin: "Administración",
  ai: "LLM",
  audit: "Auditoría",
  pii: "PII",
};

export const SERVICE_FILTERS: AuditEventService[] = ["auth", "tickets", "admin", "ai", "audit", "pii"];

export const RESULT_LABELS: Record<AuditEventResult, string> = {
  success: "Éxito",
  failure: "Fallo",
  disabled: "Deshabilitado",
};

export const RESULT_FILTERS: AuditEventResult[] = ["success", "failure", "disabled"];
