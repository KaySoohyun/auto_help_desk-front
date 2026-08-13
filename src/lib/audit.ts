import type { AuditEvent, AuditEventListQuery } from "@/types/audit.types";

export function toAuditQueryString(query: AuditEventListQuery): string {
  const params = new URLSearchParams();
  if (query.action) params.set("action", query.action);
  if (query.service) params.set("service", query.service);
  if (query.user_id !== undefined) params.set("user_id", String(query.user_id));
  if (query.result) params.set("result", query.result);
  if (query.date_from) params.set("date_from", query.date_from);
  if (query.date_to) params.set("date_to", query.date_to);
  params.set("limit", String(query.limit ?? 50));
  params.set("offset", String(query.offset ?? 0));
  return params.toString();
}

export function eventsToCsv(events: AuditEvent[]): string {
  const header = [
    "fecha",
    "usuario_id",
    "servicio",
    "accion",
    "modelo",
    "resultado",
    "confianza",
    "trace_id",
    "detalle",
  ];

  const escapeCell = (value: string): string => {
    if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
    return value;
  };

  const rows = events.map((event) =>
    [
      event.created_at,
      event.user_id !== null ? String(event.user_id) : "",
      event.service ?? "",
      event.action,
      event.model ?? "",
      event.result,
      event.confidence !== null && event.confidence !== undefined ? String(event.confidence) : "",
      event.trace_id ?? "",
      JSON.stringify(event.detail ?? {}),
    ]
      .map(escapeCell)
      .join(",")
  );

  return `\uFEFF${[header.join(","), ...rows].join("\n")}`;
}
