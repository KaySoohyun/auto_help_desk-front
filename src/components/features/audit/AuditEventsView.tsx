"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DownloadIcon,
  FilterXIcon,
  InboxIcon,
  ShieldAlertIcon,
} from "lucide-react";
import { useAuditEvents } from "@/hooks/audit/useAuditEvents";
import { useSessionStore } from "@/stores/session.store";
import { hasAuditPermission } from "@/lib/permissions";
import { eventsToCsv, toAuditQueryString } from "@/lib/audit";
import { bffFetch } from "@/lib/api/bffClient";
import { formatDateTime } from "@/lib/format";
import {
  RESULT_FILTERS,
  RESULT_LABELS,
  SERVICE_FILTERS,
  SERVICE_LABELS,
} from "@/components/features/audit/auditLabels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { AuditEvent, AuditEventListQuery } from "@/types/audit.types";

const PAGE_SIZE = 50;

function resultVariant(result: string): "default" | "secondary" | "destructive" | "outline" {
  if (result === "success") return "default";
  if (result === "failure") return "destructive";
  if (result === "disabled") return "secondary";
  return "outline";
}

function formatConfidence(value: number): string {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(value);
}

export function AuditEventsView({ searchParams }: { searchParams: Record<string, string> }) {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const canView = hasAuditPermission(user?.role ?? null, "audit:view");
  const canExport = hasAuditPermission(user?.role ?? null, "audit:export");

  const service = SERVICE_FILTERS.includes(searchParams.service as (typeof SERVICE_FILTERS)[number])
    ? (searchParams.service as (typeof SERVICE_FILTERS)[number])
    : undefined;
  const result = RESULT_FILTERS.includes(searchParams.result as (typeof RESULT_FILTERS)[number])
    ? (searchParams.result as (typeof RESULT_FILTERS)[number])
    : undefined;
  const action = searchParams.action?.trim() || undefined;
  const rawUserId = searchParams.user_id;
  const userId = rawUserId && /^\d+$/.test(rawUserId) ? Number.parseInt(rawUserId, 10) : undefined;
  const dateFrom = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date_from ?? "")
    ? searchParams.date_from
    : undefined;
  const dateTo = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date_to ?? "")
    ? searchParams.date_to
    : undefined;
  const page = Math.max(1, Number.parseInt(searchParams.page ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const query: AuditEventListQuery = {
    action,
    service,
    user_id: userId,
    result,
    date_from: dateFrom,
    date_to: dateTo,
    limit: PAGE_SIZE,
    offset,
  };
  const { data, isLoading, isError, error, refetch } = useAuditEvents(query);

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const hasFilters = Boolean(service || result || action || userId || dateFrom || dateTo);

  const updateParam = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === undefined || value === "") params.delete(key);
    else params.set(key, value);
    params.delete("page");
    router.push(`/app/audit?${params.toString()}`);
  };

  const goToPage = (pageNum: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (pageNum <= 1) params.delete("page");
    else params.set("page", String(pageNum));
    router.push(`/app/audit?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/app/audit");
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const qs = toAuditQueryString({ ...query, limit: 200, offset: 0 });
      const events = await bffFetch<AuditEvent[]>(`/api/bff/audit/events?${qs}`);
      if (events.length === 0) {
        toast.error("No hay eventos para exportar con los filtros actuales.");
        return;
      }
      const blob = new Blob([eventsToCsv(events)], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success(`${events.length} evento${events.length === 1 ? "" : "s"} exportado${events.length === 1 ? "" : "s"}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo exportar la auditoría.");
    } finally {
      setExporting(false);
    }
  };

  if (!canView) {
    return (
      <div
        role="alert"
        className="flex items-center gap-2 rounded-lg border border-destructive/60 bg-destructive/40 px-4 py-3 text-sm text-destructive-foreground"
      >
        <ShieldAlertIcon className="size-4" aria-hidden />
        No tenés permiso para acceder a la auditoría.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Auditoría</h1>
          <p className="text-sm text-muted-foreground">Eventos de auditoría del tenant</p>
        </div>
        {canExport ? (
          <Button variant="outline" onClick={() => void handleExport()} disabled={exporting}>
            <DownloadIcon aria-hidden />
            {exporting ? "Exportando…" : "Exportar CSV"}
          </Button>
        ) : null}
      </div>

      {canExport ? (
        <p className="text-xs text-muted-foreground">
          La exportación incluye hasta 200 eventos con los filtros actuales (límite del backend).
        </p>
      ) : null}

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="audit-service">Servicio</Label>
          <Select
            value={service ?? "all"}
            onValueChange={(value) => updateParam("service", value === "all" ? undefined : value)}
          >
            <SelectTrigger id="audit-service" aria-label="Filtrar por servicio" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {SERVICE_FILTERS.map((s) => (
                <SelectItem key={s} value={s}>
                  {SERVICE_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="audit-result">Resultado</Label>
          <Select
            value={result ?? "all"}
            onValueChange={(value) => updateParam("result", value === "all" ? undefined : value)}
          >
            <SelectTrigger id="audit-result" aria-label="Filtrar por resultado" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {RESULT_FILTERS.map((r) => (
                <SelectItem key={r} value={r}>
                  {RESULT_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="audit-action">Acción</Label>
          <Input
            id="audit-action"
            value={action ?? ""}
            onChange={(e) => updateParam("action", e.target.value)}
            placeholder="ej. ticket.created"
            aria-label="Filtrar por acción"
            className="w-56"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="audit-user">Usuario (id)</Label>
          <Input
            id="audit-user"
            type="number"
            min={1}
            value={userId ?? ""}
            onChange={(e) => updateParam("user_id", e.target.value)}
            placeholder="ej. 42"
            aria-label="Filtrar por id de usuario"
            className="w-32"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="audit-from">Desde</Label>
          <Input
            id="audit-from"
            type="date"
            value={dateFrom ?? ""}
            onChange={(e) => updateParam("date_from", e.target.value)}
            aria-label="Filtrar desde"
            className="w-40"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="audit-to">Hasta</Label>
          <Input
            id="audit-to"
            type="date"
            value={dateTo ?? ""}
            onChange={(e) => updateParam("date_to", e.target.value)}
            aria-label="Filtrar hasta"
            className="w-40"
          />
        </div>

        {hasFilters ? (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <FilterXIcon aria-hidden />
            Limpiar
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-destructive/60 bg-destructive/40 px-4 py-3 text-sm text-destructive-foreground"
        >
          <AlertTriangleIcon className="size-4" aria-hidden />
          {error?.message ?? "No se pudieron cargar los eventos."}
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </div>
      ) : null}

      {!isLoading && !isError ? (
        data && data.length > 0 ? (
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="px-3 py-2 font-medium">
                      Fecha
                    </th>
                    <th scope="col" className="px-3 py-2 font-medium">
                      Usuario
                    </th>
                    <th scope="col" className="px-3 py-2 font-medium">
                      Acción
                    </th>
                    <th scope="col" className="px-3 py-2 font-medium">
                      Servicio
                    </th>
                    <th scope="col" className="px-3 py-2 font-medium">
                      Modelo
                    </th>
                    <th scope="col" className="px-3 py-2 font-medium">
                      Resultado
                    </th>
                    <th scope="col" className="px-3 py-2 font-medium">
                      Confianza
                    </th>
                    <th scope="col" className="px-3 py-2 font-medium" aria-label="Ver detalle">
                      <span className="sr-only">Ver detalle</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((event) => {
                    const isExpanded = expandedId === event.id;
                    return [
                      <tr key={event.id} className="border-b border-border hover:bg-muted/50">
                        <td className="px-3 py-2 align-middle text-sm text-muted-foreground whitespace-nowrap">
                          {formatDateTime(event.created_at)}
                        </td>
                        <td className="px-3 py-2 align-middle text-sm text-foreground">
                          {event.user_id !== null ? `#${event.user_id}` : "Sistema"}
                        </td>
                        <td className="max-w-[220px] truncate px-3 py-2 align-middle text-sm text-foreground">
                          {event.action}
                        </td>
                        <td className="px-3 py-2 align-middle text-sm text-muted-foreground">
                          {event.service ? SERVICE_LABELS[event.service] ?? event.service : "—"}
                        </td>
                        <td className="px-3 py-2 align-middle text-sm text-muted-foreground">
                          {event.model ?? "—"}
                        </td>
                        <td className="px-3 py-2 align-middle">
                          <Badge variant={resultVariant(event.result)}>
                            {RESULT_LABELS[event.result] ?? event.result}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 align-middle text-sm text-muted-foreground whitespace-nowrap">
                          {event.confidence !== null && event.confidence !== undefined
                            ? formatConfidence(event.confidence)
                            : "—"}
                        </td>
                        <td className="px-3 py-2 align-middle text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-expanded={isExpanded}
                            aria-label={isExpanded ? "Ocultar detalle" : "Ver detalle"}
                            onClick={() => setExpandedId(isExpanded ? null : event.id)}
                          >
                            {isExpanded ? <ChevronDownIcon aria-hidden /> : <ChevronRightIcon aria-hidden />}
                          </Button>
                        </td>
                      </tr>,
                      isExpanded ? (
                        <tr key={`${event.id}-detail`} className="border-b border-border bg-muted/30">
                          <td colSpan={8} className="px-4 py-3">
                            <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
                              <div>
                                <dt className="text-xs text-muted-foreground">Trace ID</dt>
                                <dd className="font-mono text-xs text-foreground">{event.trace_id ?? "—"}</dd>
                              </div>
                              <div>
                                <dt className="text-xs text-muted-foreground">Versión modelo</dt>
                                <dd className="text-xs text-foreground">{event.model_version ?? "—"}</dd>
                              </div>
                              <div>
                                <dt className="text-xs text-muted-foreground">Versión prompt</dt>
                                <dd className="text-xs text-foreground">{event.prompt_version ?? "—"}</dd>
                              </div>
                              <div>
                                <dt className="text-xs text-muted-foreground">Tenant</dt>
                                <dd className="font-mono text-xs text-foreground">{event.tenant_id ?? "—"}</dd>
                              </div>
                            </dl>
                            <div className="mt-3">
                              <p className="text-xs text-muted-foreground">Detalle</p>
                              <pre className="mt-1 max-h-48 overflow-auto rounded-lg border border-border bg-background p-3 text-xs text-foreground whitespace-pre-wrap">
                                {JSON.stringify(event.detail ?? {}, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      ) : null,
                    ];
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
              <p>
                {data.length} evento{data.length === 1 ? "" : "s"} · Página {page}
                {data.length === PAGE_SIZE ? (
                  <span className="ml-2 text-xs">Hay más resultados.</span>
                ) : null}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.length < PAGE_SIZE}
                  onClick={() => goToPage(page + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
            <InboxIcon className="size-8 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">No hay eventos para mostrar.</p>
            {hasFilters ? (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <FilterXIcon aria-hidden />
                Limpiar filtros
              </Button>
            ) : null}
          </div>
        )
      ) : null}
    </div>
  );
}
