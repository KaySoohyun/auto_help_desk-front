import type { TicketListQuery } from "@/types/ticket.types";

export function ticketListKey(tenantId: string | null, query: TicketListQuery) {
  return ["tenant", tenantId ?? "global", "tickets", query] as const;
}

export function ticketDetailKey(tenantId: string | null, ticketId: number) {
  return ["tenant", tenantId ?? "global", "tickets", ticketId] as const;
}

export function ticketMessagesKey(tenantId: string | null, ticketId: number) {
  return ["tenant", tenantId ?? "global", "tickets", ticketId, "messages"] as const;
}
