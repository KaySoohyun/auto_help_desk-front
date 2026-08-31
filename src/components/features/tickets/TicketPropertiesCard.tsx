"use client";

import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Ticket, TicketPriority, TicketStatus } from "@/types/ticket.types";
import { formatDateTime } from "@/lib/format";
import { STATUS_LABELS, PRIORITY_LABELS } from "@/components/features/tickets/TicketBadges";
import { useUpdateTicket } from "@/hooks/tickets/useUpdateTicket";
import { useCategories } from "@/hooks/tickets/useCategories";
import { useSessionStore } from "@/stores/session.store";
import { useTenantSlug } from "@/hooks/useTenantSlug";

interface TicketPropertiesCardProps {
  ticket: Ticket;
}

function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-8 items-center justify-between gap-3">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function PropertyText({ value }: { value: string }) {
  return (
    <span className="text-right text-sm font-semibold text-foreground">{value}</span>
  );
}

export function TicketPropertiesCard({ ticket }: TicketPropertiesCardProps) {
  const updateTicket = useUpdateTicket(ticket.id);
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const user = useSessionStore((s) => s.user);
  const slug = useTenantSlug();

  const isAssignedToMe = ticket.assignee_id === user?.id;
  const busy = updateTicket.isPending;

  const update = async (
    payload: Parameters<typeof updateTicket.mutateAsync>[0],
    label: string
  ) => {
    try {
      await updateTicket.mutateAsync(payload);
      toast.success(`${label} actualizado`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `No se pudo actualizar ${label}.`);
    }
  };

  const changeAssignee = async (value: string) => {
    if (!user) return;
    const assigneeId = value === "me" ? user.id : null;
    try {
      await updateTicket.mutateAsync({ assignee_id: assigneeId });
      toast.success(assigneeId ? "Ticket asignado a vos" : "Ticket desasignado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar la asignación.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Propiedades</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        <PropertyRow label="Estado">
          <Select
            value={ticket.status}
            onValueChange={(value) => update({ status: value as TicketStatus }, "Estado")}
            disabled={busy}
          >
            <SelectTrigger aria-label="Cambiar estado" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(STATUS_LABELS) as Array<[TicketStatus, string]>).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </PropertyRow>

        <PropertyRow label="Prioridad">
          <Select
            value={ticket.priority ?? ""}
            onValueChange={(value) => update({ priority: value as TicketPriority }, "Prioridad")}
            disabled={busy}
          >
            <SelectTrigger aria-label="Cambiar prioridad" className="w-40">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(PRIORITY_LABELS) as Array<[TicketPriority, string]>).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </PropertyRow>

        <PropertyRow label="Agente">
          <Select
            value={isAssignedToMe ? "me" : "unassigned"}
            onValueChange={changeAssignee}
            disabled={busy}
          >
            <SelectTrigger aria-label="Cambiar agente" className="w-40 shrink-0 overflow-hidden">
              <SelectValue placeholder="Sin asignar">
                {isAssignedToMe ? (
                  <span className="block max-w-full truncate text-right">
                    {user?.email ?? "Asignarme"}
                  </span>
                ) : null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Sin asignar</SelectItem>
              <SelectItem value="me" className="max-w-[14rem]">
                <span className="block truncate">{user?.email ?? "Asignarme"}</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </PropertyRow>

        <PropertyRow label="Categoría">
          <Select
            value={ticket.category ?? ""}
            onValueChange={(value) => update({ category: value }, "Categoría")}
            disabled={busy || categoriesLoading}
          >
            <SelectTrigger aria-label="Cambiar categoría" className="w-40">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PropertyRow>

        <PropertyRow label="Tenant">
          <PropertyText value={slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : "—"} />
        </PropertyRow>

        <PropertyRow label="Creado">
          <PropertyText value={formatDateTime(ticket.created_at)} />
        </PropertyRow>

        <PropertyRow label="Actualizado">
          <PropertyText value={formatDateTime(ticket.updated_at)} />
        </PropertyRow>
      </CardContent>
    </Card>
  );
}
