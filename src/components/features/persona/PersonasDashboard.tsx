"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Inbox, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { STATUS_LABELS } from "@/components/features/tickets/TicketBadges";
import { useMyTickets } from "@/hooks/persona/useMyTickets";
import { useMyProfile } from "@/hooks/persona/useMyProfile";
import { PersonaTicketCard } from "./PersonaTicketCard";
import { CreateTicketDialog } from "./CreateTicketDialog";
import type { TicketStatus } from "@/types/ticket.types";

const FILTER_LABELS: Record<TicketStatus, string> = {
  ...STATUS_LABELS,
  closed: "Resuelto",
};

const FILTERS: Array<{ key: TicketStatus | "all"; label: string }> = [
  { key: "all", label: "Todos" },
  ...(Object.entries(FILTER_LABELS) as Array<[TicketStatus, string]>).map(([key, label]) => ({ key, label })),
];

const PAGE_SIZE = 10;

export function PersonasDashboard() {
  const { data: profile } = useMyProfile();
  const [filter, setFilter] = useState<TicketStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const status = filter === "all" ? undefined : filter;
  const { data, isLoading, isError, refetch } = useMyTickets({
    status,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data?.items ?? [];
    return (data?.items ?? []).filter((t) => {
      return t.subject.toLowerCase().includes(q) || (t.category?.toLowerCase().includes(q) ?? false);
    });
  }, [data, query]);

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const name = profile?.name ?? "Cliente";

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      {/* Welcome */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Hola, {name} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestioná tus incidencias y conversá con el equipo de soporte.
          </p>
        </div>
        <CreateTicketDialog
          trigger={
            <Button size="lg" className="h-12 rounded-xl shadow-sm">
              <Plus className="mr-1.5 h-4 w-4" aria-hidden />
              Crear nuevo ticket
            </Button>
          }
        />
      </div>

      {/* Filters + search */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar tickets por título o categoría…"
            aria-label="Buscar tickets"
            className="h-11 w-full rounded-xl border border-input bg-card pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1 sm:pb-0">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => {
                setFilter(f.key);
                setPage(1);
              }}
              className={cn(
                "inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                filter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <h2 className="text-lg font-semibold">No pudimos cargar tus tickets</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ocurrió un error. Intentá de nuevo.
          </p>
          <Button className="mt-4" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <Inbox className="mx-auto mb-4 h-12 w-12 text-muted-foreground" aria-hidden />
          <h2 className="text-lg font-semibold">
            {data?.items.length === 0 ? "Aún no tenés tickets" : "Sin resultados"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {data?.items.length === 0
              ? "Creá tu primer ticket de soporte y nuestro equipo te va a ayudar."
              : "Probá con otro filtro o término de búsqueda."}
          </p>
          {data?.items.length === 0 ? (
            <div className="mt-5 flex justify-center">
              <CreateTicketDialog
                trigger={
                  <Button>
                    <Plus className="mr-1.5 h-4 w-4" aria-hidden />
                    Crear ticket
                  </Button>
                }
              />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => (
            <PersonaTicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}

      {!isLoading && !isError && total > 0 && (
        <div className="mt-6 flex items-center justify-between">
          {page > 1 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
              Anterior
            </Button>
          ) : (
            <span />
          )}
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Siguiente
            <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
          </Button>
        </div>
      )}
    </main>
  );
}
