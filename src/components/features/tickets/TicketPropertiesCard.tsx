"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, User, Folder, Flag } from "lucide-react";
import type { Ticket } from "@/types/ticket.types";
import { formatDateTime } from "@/lib/format";

interface TicketPropertiesCardProps {
  ticket: Ticket;
}

export function TicketPropertiesCard({ ticket }: TicketPropertiesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Propiedades del ticket</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Flag className="size-4 text-muted-foreground" />
          <span className="text-sm capitalize">{ticket.priority ?? "Sin prioridad"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Folder className="size-4 text-muted-foreground" />
          <span className="text-sm">{ticket.category ?? "Sin categoría"}</span>
        </div>
        <div className="flex items-center gap-2">
          <User className="size-4 text-muted-foreground" />
          <span className="text-sm">
            {ticket.assignee_id ? `Asignado #${ticket.assignee_id}` : "Sin asignar"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-muted-foreground" />
          <span className="text-sm">Creado: {formatDateTime(ticket.created_at)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" />
          <span className="text-sm">Actualizado: {formatDateTime(ticket.updated_at)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
