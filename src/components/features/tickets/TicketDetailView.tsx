"use client";

import { toast } from "sonner";
import { useTicket } from "@/hooks/tickets/useTicket";
import { useUpdateTicket } from "@/hooks/tickets/useUpdateTicket";
import { useSessionStore } from "@/stores/session.store";
import { hasTicketPermission } from "@/lib/permissions";
import { TicketMetadata } from "@/components/features/tickets/TicketDetail";
import { TicketThread } from "@/components/features/tickets/TicketThread";
import { MessageComposer } from "@/components/features/tickets/MessageComposer";
import { TicketActions } from "@/components/features/tickets/TicketActions";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertTriangleIcon, UserPlusIcon, UserMinusIcon } from "lucide-react";

export function TicketDetailView({ ticketId }: { ticketId: number }) {
  const { data: ticket, isLoading, isError, error } = useTicket(ticketId);
  const updateTicket = useUpdateTicket(ticketId);
  const user = useSessionStore((s) => s.user);

  if (isLoading) {
    return (
      <div className="space-y-4" aria-label="Cargando ticket">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div
        role="alert"
        className="flex items-center gap-2 rounded-lg border border-destructive/60 bg-destructive/40 px-4 py-3 text-sm text-destructive-foreground"
      >
        <AlertTriangleIcon className="size-4" aria-hidden />
        {error?.message ?? "No se pudo cargar el ticket."}
      </div>
    );
  }

  const canEdit = hasTicketPermission(user?.role ?? null, "responses:edit");
  const canClose = hasTicketPermission(user?.role ?? null, "responses:send");
  const isAssignedToMe = ticket.assignee_id === user?.id;

  const toggleAssignment = async () => {
    if (!user) return;
    try {
      await updateTicket.mutateAsync({
        assignee_id: isAssignedToMe ? null : user.id,
      });
      toast.success(isAssignedToMe ? "Ticket desasignado" : "Ticket asignado a vos");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar la asignación.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Ticket #{ticket.id}</p>
          <h1 className="text-xl font-semibold text-foreground">{ticket.subject}</h1>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
            {ticket.description}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canEdit ? (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAssignment}
              disabled={updateTicket.isPending}
            >
              {isAssignedToMe ? <UserMinusIcon aria-hidden /> : <UserPlusIcon aria-hidden />}
              {isAssignedToMe ? "Desasignarme" : "Asignarme"}
            </Button>
          ) : null}
          <TicketActions
            ticket={ticket}
            canEdit={canEdit}
            canClose={canClose}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border p-4">
        <TicketMetadata ticket={ticket} />
      </div>

      <section className="space-y-3" aria-label="Conversación">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Conversación
        </h2>
        <TicketThread ticketId={ticket.id} selfId={user?.id ?? null} />
        {canEdit ? (
          <div className="rounded-lg border border-border bg-card p-3">
            <MessageComposer ticketId={ticket.id} />
          </div>
        ) : null}
      </section>
    </div>
  );
}
