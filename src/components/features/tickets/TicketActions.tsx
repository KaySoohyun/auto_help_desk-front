"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2Icon, XCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useCloseTicket } from "@/hooks/tickets/useCloseTicket";
import { useUpdateTicket } from "@/hooks/tickets/useUpdateTicket";
import type { Ticket, TicketPriority, TicketStatus } from "@/types/ticket.types";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/components/features/tickets/TicketBadges";

interface TicketActionsProps {
  ticket: Ticket;
  canEdit: boolean;
  canClose: boolean;
}

export function TicketActions({ ticket, canEdit, canClose }: TicketActionsProps) {
  const updateTicket = useUpdateTicket(ticket.id);
  const closeTicket = useCloseTicket(ticket.id);
  const [closeOpen, setCloseOpen] = useState(false);

  const update = async (payload: Parameters<typeof updateTicket.mutateAsync>[0], label: string) => {
    try {
      await updateTicket.mutateAsync(payload);
      toast.success(`${label} actualizado`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `No se pudo actualizar ${label}.`);
    }
  };

  const handleClose = async () => {
    try {
      await closeTicket.mutateAsync();
      setCloseOpen(false);
      toast.success("Ticket cerrado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cerrar el ticket.");
    }
  };

  const busy = updateTicket.isPending || closeTicket.isPending;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canEdit ? (
        <Select
          value={ticket.status}
          onValueChange={(value) => update({ status: value as TicketStatus }, "Estado")}
          disabled={busy}
        >
          <SelectTrigger aria-label="Cambiar estado" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(STATUS_LABELS) as Array<[TicketStatus, string]>).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      {canEdit ? (
        <Select
          value={ticket.priority ?? ""}
          onValueChange={(value) => update({ priority: value as TicketPriority }, "Prioridad")}
          disabled={busy}
        >
          <SelectTrigger aria-label="Cambiar prioridad" className="w-40">
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(PRIORITY_LABELS) as Array<[TicketPriority, string]>).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      {canClose && ticket.status !== "closed" ? (
        <AlertDialog open={closeOpen} onOpenChange={setCloseOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="outline" disabled={busy}>
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
                <Button variant="outline" disabled={busy}>
                  Cancelar
                </Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button variant="destructive" onClick={handleClose} disabled={busy}>
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
  );
}
