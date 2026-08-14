"use client";

import Link from "next/link";
import { CalendarIcon } from "lucide-react";
import { TicketPriorityBadge, TicketStatusBadge } from "@/components/features/tickets/TicketBadges";
import { timeAgo } from "@/lib/format";
import type { TicketSummary } from "@/types/ticket.types";

export function PersonaTicketCard({ ticket }: { ticket: TicketSummary }) {
  return (
    <Link
      href={`/panel/tickets/${ticket.id}`}
      className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-sm"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">#{String(ticket.id).slice(-6).toUpperCase()}</span>
          <TicketStatusBadge status={ticket.status} />
          <TicketPriorityBadge priority={ticket.priority} />
        </div>
        <h3 className="mt-2 text-sm font-semibold text-foreground group-hover:text-primary">
          {ticket.subject}
        </h3>
        {ticket.category ? (
          <p className="mt-0.5 text-xs capitalize text-muted-foreground">{ticket.category}</p>
        ) : null}
      </div>
      <span className="mt-0.5 inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
        <CalendarIcon className="size-3.5" aria-hidden />
        {timeAgo(ticket.created_at)}
      </span>
    </Link>
  );
}
