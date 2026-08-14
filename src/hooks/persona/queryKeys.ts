import type { TicketListQuery } from "@/types/ticket.types";

export const myTicketsKey = (query: TicketListQuery = {}) =>
  ["persona", "my-tickets", query] as const;

export const myTicketKey = (ticketId: number) => ["persona", "my-ticket", ticketId] as const;

export const myMessagesKey = (ticketId: number) => ["persona", "my-ticket", ticketId, "messages"] as const;
