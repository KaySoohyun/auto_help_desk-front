"use client";

import { useMessages } from "@/hooks/tickets/useMessages";
import { formatDateTime } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquareIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TicketMessage } from "@/types/ticket.types";

function MessageItem({ message, selfId }: { message: TicketMessage; selfId: number | null }) {
  const isOwn = message.author_id !== null && message.author_id === selfId;
  const authorName = isOwn ? "Vos" : message.author_id ? `Agente #${message.author_id}` : "Sistema";

  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5",
          isOwn
            ? "rounded-br-sm bg-foreground/80 text-primary-foreground"
            : "rounded-bl-sm border border-border bg-muted/40"
        )}
      >
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className={cn("font-bold", isOwn ? "text-primary-foreground" : "text-foreground")}>
            {authorName}
          </span>
        </div>
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.body}</p>
        <time
          dateTime={message.created_at}
          className={cn("mt-1 block text-[11px]", isOwn ? "text-primary-foreground/70" : "text-muted-foreground")}
        >
          {formatDateTime(message.created_at)}
        </time>
      </div>
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
    <ol className="space-y-3">
      {data.map((message) => (
        <li key={message.id}>
          <MessageItem message={message} selfId={selfId} />
        </li>
      ))}
    </ol>
  );
}
