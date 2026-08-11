import { Badge } from "@/components/ui/badge";
import type { TicketPriority, TicketStatus } from "@/types/ticket.types";

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Abierto",
  in_progress: "En curso",
  on_hold: "En espera",
  closed: "Cerrado",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
};

const STATUS_VARIANTS: Record<TicketStatus, "default" | "secondary" | "destructive" | "outline"> = {
  open: "secondary",
  in_progress: "default",
  on_hold: "outline",
  closed: "secondary",
};

const PRIORITY_VARIANTS: Record<TicketPriority, "default" | "secondary" | "destructive" | "outline"> = {
  low: "secondary",
  medium: "outline",
  high: "default",
  urgent: "destructive",
};

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>;
}

export function TicketPriorityBadge({ priority }: { priority: TicketPriority | null }) {
  if (!priority) return <span className="text-xs text-muted-foreground">—</span>;
  return <Badge variant={PRIORITY_VARIANTS[priority]}>{PRIORITY_LABELS[priority]}</Badge>;
}
