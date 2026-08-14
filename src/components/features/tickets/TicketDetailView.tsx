"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { useTicket } from "@/hooks/tickets/useTicket";
import { useUpdateTicket } from "@/hooks/tickets/useUpdateTicket";
import { useMessages } from "@/hooks/tickets/useMessages";
import { useCustomer } from "@/hooks/tickets/useCustomer";
import { useSessionStore } from "@/stores/session.store";
import { hasTicketPermission } from "@/lib/permissions";
import { buildTicketContext } from "@/lib/llm/context";
import { TicketThread } from "@/components/features/tickets/TicketThread";
import { MessageComposer } from "@/components/features/tickets/MessageComposer";
import { TicketActions } from "@/components/features/tickets/TicketActions";
import { CustomerCard } from "@/components/features/tickets/CustomerCard";
import { TicketPropertiesCard } from "@/components/features/tickets/TicketPropertiesCard";
import { TicketTagsCard } from "@/components/features/tickets/TicketTagsCard";
import { TicketClosedNotice } from "@/components/features/tickets/TicketClosedNotice";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertTriangleIcon, UserPlusIcon, UserMinusIcon } from "lucide-react";

const LlmAssistantPanel = dynamic(
  () =>
    import("@/components/llm/LlmAssistantPanel").then(
      (mod) => mod.LlmAssistantPanel
    ),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3 rounded-lg border border-border bg-card p-4" aria-label="Cargando asistente LLM">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    ),
  }
);

export function TicketDetailView({ ticketId }: { ticketId: number }) {
  const { data: ticket, isLoading, isError, error } = useTicket(ticketId);
  const { data: messages } = useMessages(ticketId);
  const updateTicket = useUpdateTicket(ticketId);
  const user = useSessionStore((s) => s.user);
  const [composerDraft, setComposerDraft] = useState<string | undefined>(undefined);

  // Obtener datos del cliente si el ticket tiene customer_id
  const { data: customer, isLoading: isLoadingCustomer } = useCustomer(
    ticket?.customer_id ?? null
  );

  const handleInsertReference = (reference: string) => {
    setComposerDraft((prev) => {
      const base = prev?.trim() ?? "";
      return base ? `${base}\n\n${reference}` : reference;
    });
  };

  const contextText = useMemo(
    () =>
      buildTicketContext({
        subject: ticket?.subject,
        description: ticket?.description,
        messages,
      }),
    [ticket?.subject, ticket?.description, messages]
  );

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
  const isClosed = ticket.status === "closed";

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
    <div className="grid gap-4 lg:grid-cols-[20%_50%_30%]">
      {/* Columna 1: Metadata (20%) */}
      <div className="space-y-4">
        <CustomerCard customer={customer} isLoading={isLoadingCustomer} />
        <TicketPropertiesCard ticket={ticket} />
        <TicketTagsCard ticketId={ticket.id} />
      </div>

      {/* Columna 2: Conversación (50%) */}
      <div className="min-w-0 space-y-4">
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

        <section className="space-y-3" aria-label="Conversación">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Conversación
          </h2>
          <TicketThread ticketId={ticket.id} selfId={user?.id ?? null} />
          
          {isClosed ? (
            <TicketClosedNotice />
          ) : canEdit ? (
            <div className="rounded-lg border border-border bg-card p-3">
              <MessageComposer
                ticketId={ticket.id}
                initialValue={composerDraft}
                disabled={isClosed}
              />
            </div>
          ) : null}
        </section>
      </div>

      {/* Columna 3: Asistente LLM (30%) */}
      <LlmAssistantPanel
        ticketId={ticket.id}
        contextText={contextText}
        onUseReply={setComposerDraft}
        ticketCategory={ticket.category}
        onInsertReference={handleInsertReference}
      />
    </div>
  );
}
