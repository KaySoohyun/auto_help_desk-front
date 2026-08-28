"use client";

import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "@/components/features/tickets/TicketBadges";
import { formatDateTime } from "@/lib/format";
import { categoryLabel } from "@/lib/constants/categories";
import type { Ticket } from "@/types/ticket.types";

export function TicketMetadata({ ticket }: { ticket: Ticket }) {
  const rows: Array<{ label: string; value: React.ReactNode }> = [
    {
      label: "Estado",
      value: <TicketStatusBadge status={ticket.status} />,
    },
    {
      label: "Prioridad",
      value: <TicketPriorityBadge priority={ticket.priority} />,
    },
    { label: "Categoría", value: categoryLabel(ticket.category) },
    { label: "Asignado", value: ticket.assignee_id ? `#${ticket.assignee_id}` : "Sin asignar" },
    { label: "Creado", value: formatDateTime(ticket.created_at) },
    { label: "Actualizado", value: formatDateTime(ticket.updated_at) },
  ];

  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex items-center justify-between gap-2">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="text-sm font-medium text-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
