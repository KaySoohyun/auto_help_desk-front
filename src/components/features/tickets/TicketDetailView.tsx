"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { useTicket } from "@/hooks/tickets/useTicket";
import { useCloseTicket } from "@/hooks/tickets/useCloseTicket";
import { useCustomer } from "@/hooks/tickets/useCustomer";
import { useSessionStore } from "@/stores/session.store";
import { hasTicketPermission } from "@/lib/permissions";
import { TicketThread } from "@/components/features/tickets/TicketThread";
import { MessageComposer } from "@/components/features/tickets/MessageComposer";
import { TicketPropertiesCard } from "@/components/features/tickets/TicketPropertiesCard";
import { CustomerCard } from "@/components/features/tickets/CustomerCard";
import { TicketTagsCard } from "@/components/features/tickets/TicketTagsCard";
import { TicketClosedNotice } from "@/components/features/tickets/TicketClosedNotice";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2Icon, AlertTriangleIcon, XCircleIcon } from "lucide-react";

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
  const closeTicket = useCloseTicket(ticketId);
  const user = useSessionStore((s) => s.user);
  const [composerDraft, setComposerDraft] = useState<string | undefined>(undefined);
  const [closeOpen, setCloseOpen] = useState(false);

  // Obtener datos del cliente si el ticket tiene customer_id
  const { data: customer, isLoading: isLoadingCustomer } = useCustomer(
    ticket?.customer_id ?? null
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
  const isClosed = ticket.status === "closed";

  const handleClose = async () => {
    try {
      await closeTicket.mutateAsync();
      setCloseOpen(false);
      toast.success("Ticket cerrado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cerrar el ticket.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header superior: resumen del ticket + cerrar */}
      <div className="flex w-full flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm text-muted-foreground">Ticket #{ticket.id}</p>
          <h1 className="text-xl font-semibold text-foreground">{ticket.subject}</h1>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
            {ticket.description}
          </p>
        </div>
        {canClose && !isClosed ? (
          <AlertDialog open={closeOpen} onOpenChange={setCloseOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={closeTicket.isPending}>
                <XCircleIcon aria-hidden />
                Cerrar ticket
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Cerrar ticket #{ticket.id}?</AlertDialogTitle>
                <AlertDialogDescription>
                  El ticket pasará a estado &quot;Cerrado&quot;. No se podrán agregar más respuestas.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel asChild>
                  <Button variant="outline" disabled={closeTicket.isPending}>
                    Cancelar
                  </Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button variant="destructive" onClick={handleClose} disabled={closeTicket.isPending}>
                    {closeTicket.isPending ? (
                      <Loader2Icon className="size-4 animate-spin" aria-hidden />
                    ) : null}
                    Cerrar
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[20%_50%_30%]">
        {/* Columna 1: Metadata (20%) */}
        <div className="space-y-4">
          <CustomerCard customer={customer} isLoading={isLoadingCustomer} />
          <TicketPropertiesCard ticket={ticket} />
          <TicketTagsCard ticketId={ticket.id} />
        </div>

        {/* Columna 2: Conversación (50%) */}
        <div className="min-w-0 space-y-4">
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
          onUseReply={setComposerDraft}
        />
      </div>
    </div>
  );
}
