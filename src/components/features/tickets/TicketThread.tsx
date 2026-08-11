"use client";

import { useMessages } from "@/hooks/tickets/useMessages";
import { formatDateTime } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquareIcon } from "lucide-react";
import type { TicketMessage } from "@/types/ticket.types";

function MessageItem({ message, selfId }: { message: TicketMessage; selfId: number | null }) {
  const isOwn = message.author_id !== null && message.author_id === selfId;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          {isOwn ? "Vos" : message.author_id ? `Agente #${message.author_id}` : "Sistema"}
        </span>
        <time dateTime={message.created_at}>{formatDateTime(message.created_at)}</time>
      </div>
      <p className="text-sm text-foreground whitespace-pre-wrap break-words">{message.body}</p>
    </div>
  );
}

export function TicketThread({
  ticketId,
  selfId,
}: {
  ticketId: number;
  selfId: number | null;
}) {
  const { data, isLoading, isError, error } = useMessages(ticketId);

  if (isLoading) {
    return (
      <div className="space-y-4" aria-label="Cargando mensajes">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {error?.message ?? "No se pudieron cargar los mensajes."}
      </p>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <MessageSquareIcon className="size-6 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">
          Todavía no hay mensajes en este ticket. Respondé para iniciar la conversación.
        </p>
      </div>
    );
  }

  return (
    <ol className="space-y-4">
      {data.map((message) => (
        <li key={message.id} className="rounded-lg border border-border bg-card p-3">
          <MessageItem message={message} selfId={selfId} />
        </li>
      ))}
    </ol>
  );
}
