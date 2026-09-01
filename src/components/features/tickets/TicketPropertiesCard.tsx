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
import { useAgents } from "@/hooks/tickets/useAgents";
import { useSessionStore } from "@/stores/session.store";
import { useTenantSlug } from "@/hooks/useTenantSlug";
import type { Agent } from "@/types/agent.types";

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

function AgentOption({ agent }: { agent: Agent }) {
  return (
    <span className="flex flex-col">
      <span className="truncate">{agent.name || agent.email}</span>
      {agent.name ? (
        <span className="truncate text-xs text-muted-foreground">{agent.email}</span>
      ) : null}
    </span>
  );
}

export function TicketPropertiesCard({ ticket }: TicketPropertiesCardProps) {
  const updateTicket = useUpdateTicket(ticket.id);
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: agents = [] } = useAgents();
  const user = useSessionStore((s) => s.user);
  const slug = useTenantSlug();

  const isAgentRole = user?.role === "agent";
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

  // Rol agent: solo puede asignarse a sí mismo; los demás ven todos los agentes activos.
  // El self se arma desde la sesión (no depende del listado de /v1/agents), así el
  // agente SIEMPRE puede autoasignarse.
  const selfOption: Agent | null = user
    ? { id: user.id, name: user.name, email: user.email, role: user.role, is_active: true }
    : null;

  const optionAgents: Agent[] = isAgentRole
    ? selfOption
      ? [selfOption]
      : []
    : agents.filter((a) => a.is_active !== false);

  const currentAssignee = ticket.assignee;
  // Si el actual no está en la lista (p. ej. asignado por otro rol), se agrega solo
  // para mostrar el nombre/email en el trigger; el rol agent no puede elegirlo.
  if (
    currentAssignee &&
    !optionAgents.some((a) => a.id === currentAssignee.id)
  ) {
    optionAgents.push({ ...currentAssignee, is_active: true });
  }

  const assigneeValue = ticket.assignee_id ? String(ticket.assignee_id) : "unassigned";
  const isSelectableOption = (agent: Agent) =>
    !isAgentRole || agent.id === user?.id;

  const changeAssignee = async (value: string) => {
    if (value === "unassigned") {
      try {
        await updateTicket.mutateAsync({ assignee_id: null });
        toast.success("Ticket desasignado");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo actualizar la asignación.");
      }
      return;
    }
    const assigneeId = Number(value);
    const agent = optionAgents.find((a) => a.id === assigneeId);
    try {
      await updateTicket.mutateAsync({ assignee_id: assigneeId });
      toast.success(agent ? `Ticket asignado a ${agent.name || agent.email}` : "Ticket asignado");
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
            value={assigneeValue}
            onValueChange={changeAssignee}
            disabled={busy}
          >
            <SelectTrigger aria-label="Cambiar agente" className="w-44 shrink-0 overflow-hidden">
              <SelectValue>
                {currentAssignee ? (
                  <span className="block max-w-full text-right">
                    <span className="block truncate text-sm font-medium">
                      {currentAssignee.name || currentAssignee.email}
                    </span>
                    {currentAssignee.name ? (
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {currentAssignee.email}
                      </span>
                    ) : null}
                  </span>
                ) : (
                  <span className="block truncate text-sm text-muted-foreground">Sin asignar</span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Sin asignar</SelectItem>
              {optionAgents.map((agent) => (
                <SelectItem
                  key={agent.id}
                  value={String(agent.id)}
                  disabled={!isSelectableOption(agent)}
                >
                  <AgentOption agent={agent} />
                </SelectItem>
              ))}
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
