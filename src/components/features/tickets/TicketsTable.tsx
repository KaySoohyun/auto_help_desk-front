"use client";

import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "@/components/features/tickets/TicketBadges";
import { useTicketSelectionStore } from "@/stores/ticket-selection.store";
import { timeAgo } from "@/lib/format";
import type { TicketSummary } from "@/types/ticket.types";

function TicketRow({ ticket }: { ticket: TicketSummary }) {
  const toggle = useTicketSelectionStore((s) => s.toggle);
  const isSelected = useTicketSelectionStore((s) => s.selectedIds.includes(ticket.id));

  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/50">
      <td className="px-3 py-2 align-middle">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => toggle(ticket.id)}
          aria-label={`Seleccionar ticket #${ticket.id}`}
        />
      </td>
      <td className="px-3 py-2 align-middle">
        <Link
          href={`/app/tickets/${ticket.id}`}
          className="line-clamp-2 text-sm font-medium text-foreground hover:underline"
        >
          {ticket.subject}
        </Link>
      </td>
      <td className="px-3 py-2 align-middle">
        <TicketStatusBadge status={ticket.status} />
      </td>
      <td className="px-3 py-2 align-middle">
        <TicketPriorityBadge priority={ticket.priority} />
      </td>
      <td className="px-3 py-2 align-middle text-sm text-muted-foreground">
        {ticket.category ?? "—"}
      </td>
      <td className="px-3 py-2 align-middle text-sm text-muted-foreground">
        {ticket.assignee_id ? `#${ticket.assignee_id}` : "Sin asignar"}
      </td>
      <td className="px-3 py-2 align-middle text-right text-sm text-muted-foreground whitespace-nowrap">
        {timeAgo(ticket.created_at)}
      </td>
    </tr>
  );
}

export function TicketsTable({ tickets }: { tickets: TicketSummary[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
            <th scope="col" className="w-10 px-3 py-2 font-medium" aria-label="Selección" />
            <th scope="col" className="px-3 py-2 font-medium">
              Ticket
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Estado
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Prioridad
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Categoría
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Asignado
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              Antigüedad
            </th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <TicketRow key={ticket.id} ticket={ticket} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
