export type TicketStatus = "open" | "in_progress" | "on_hold" | "closed";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export interface TicketSummary {
  id: number;
  tenant_id: string;
  subject: string;
  category: string | null;
  priority: TicketPriority | null;
  status: TicketStatus;
  assignee_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface Ticket extends TicketSummary {
  description: string;
}

export interface TicketList {
  items: TicketSummary[];
  total: number;
  limit: number;
  offset: number;
}

export interface TicketMessage {
  id: number;
  ticket_id: number;
  author_id: number | null;
  body: string;
  created_at: string;
}

export interface TicketListQuery {
  status?: TicketStatus;
  category?: string;
  priority?: TicketPriority;
  assignee_id?: number;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface TicketUpdatePayload {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string;
  assignee_id?: number | null;
}

export interface CreateTicketPayload {
  subject: string;
  description: string;
  category?: string;
  priority?: TicketPriority;
}
