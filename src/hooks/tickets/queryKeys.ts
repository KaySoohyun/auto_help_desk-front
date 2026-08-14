import type { TicketListQuery } from "@/types/ticket.types";

export const queryKeys = {
  categories: ["tickets", "categories"] as const,
};

export function ticketListKey(tenantId: string | null, query: TicketListQuery) {
  return ["tenant", tenantId ?? "global", "tickets", query] as const;
}

export function ticketDetailKey(tenantId: string | null, ticketId: number) {
  return ["tenant", tenantId ?? "global", "tickets", ticketId] as const;
}

export function ticketMessagesKey(tenantId: string | null, ticketId: number) {
  return ["tenant", tenantId ?? "global", "tickets", ticketId, "messages"] as const;
}

export function ticketTagsKey(tenantId: string | null, ticketId: number) {
  return ["tenant", tenantId ?? "global", "tickets", ticketId, "tags"] as const;
}

export function ticketAnalyzeKey(tenantId: string | null, ticketId: number) {
  return ["tenant", tenantId ?? "global", "tickets", ticketId, "analyze"] as const;
}

export function customerKey(tenantId: string | null, customerId: number) {
  return ["tenant", tenantId ?? "global", "customers", customerId] as const;
}

export function tenantKey(tenantId: string | null) {
  return ["tenant", tenantId ?? "global"] as const;
}
