"use client";

import { useEffect, useRef, useState } from "react";
import { useTickets } from "@/hooks/tickets/useTickets";
import { TicketsFilters } from "@/components/features/tickets/TicketsFilters";
import { TicketsTable } from "@/components/features/tickets/TicketsTable";
import { TicketsPagination } from "@/components/features/tickets/TicketsPagination";
import { CreateTicketDialog } from "@/components/features/tickets/CreateTicketDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { SearchIcon, InboxIcon, AlertTriangleIcon } from "lucide-react";
import type { TicketPriority, TicketStatus } from "@/types/ticket.types";

const PAGE_SIZE = 50;

const VALID_STATUSES: TicketStatus[] = ["open", "in_progress", "on_hold", "closed"];
const VALID_PRIORITIES: TicketPriority[] = ["low", "medium", "high", "urgent"];

export function TicketsPageView({ searchParams }: { searchParams: Record<string, string> }) {
  const rawStatus = searchParams.status;
  const rawPriority = searchParams.priority;
  const status = VALID_STATUSES.includes(rawStatus as TicketStatus) ? (rawStatus as TicketStatus) : undefined;
  const priority = VALID_PRIORITIES.includes(rawPriority as TicketPriority)
    ? (rawPriority as TicketPriority)
    : undefined;
  const category = searchParams.category ?? undefined;
  const page = Math.max(1, Number.parseInt(searchParams.page ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const { data, isLoading, isError, error } = useTickets({
    status,
    priority,
    category,
    q: debouncedSearch.trim() || undefined,
    limit: PAGE_SIZE,
    offset,
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Tickets</h1>
          <p className="text-sm text-muted-foreground">Bandeja de tickets de tu soporte</p>
        </div>
        <CreateTicketDialog />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por categoría o etiquetas"
            aria-label="Buscar por categoría o etiquetas"
            className="w-56 pl-9"
          />
        </div>
        <TicketsFilters />
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
          {error?.message ?? "No se pudieron cargar los tickets."}
        </div>
      ) : null}

      {!isLoading && !isError && data ? (
        items.length > 0 ? (
          <TicketsTable tickets={items} />
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
            <InboxIcon className="size-8 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">No hay tickets para mostrar.</p>
          </div>
        )
      ) : null}

      {!isLoading && !isError && data && data.total > PAGE_SIZE ? (
        <TicketsPagination total={data.total} limit={PAGE_SIZE} offset={offset} />
      ) : null}
    </div>
  );
}
