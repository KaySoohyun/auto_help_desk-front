export interface Tag {
  id: number;
  tenant_id: string;
  name: string;
  created_at: string;
}

export interface TicketTag {
  ticket_id: number;
  tag_id: number;
  tag: Tag;
}
