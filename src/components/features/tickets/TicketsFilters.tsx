"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RotateCcwIcon } from "lucide-react";
import { useTenantSlug } from "@/hooks/useTenantSlug";
import type { TicketPriority, TicketStatus } from "@/types/ticket.types";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/components/features/tickets/TicketBadges";
import { useCategories } from "@/hooks/tickets/useCategories";

const STATUSES: Array<{ value: TicketStatus; label: string }> = (
  Object.entries(STATUS_LABELS) as Array<[TicketStatus, string]>
).map(([value, label]) => ({ value, label }));

const PRIORITIES: Array<{ value: TicketPriority; label: string }> = (
  Object.entries(PRIORITY_LABELS) as Array<[TicketPriority, string]>
).map(([value, label]) => ({ value, label }));

export function TicketsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = useTenantSlug();
  const { data: categories = [] } = useCategories();

  const apply = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === "") params.delete(key);
      else params.set(key, value);
    }
    router.push(`/${slug}/app/tickets?${params.toString()}`);
  };

  const hasActive =
    searchParams.has("status") || searchParams.has("priority") || searchParams.has("category");

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtros de tickets">
      <Select
        value={searchParams.get("category") ?? ""}
        onValueChange={(value) => apply({ category: value || undefined })}
      >
        <SelectTrigger aria-label="Filtrar por categoría" className="w-44">
          <SelectValue placeholder="Categoría" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todas las categorías</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.value} value={cat.value}>
              {cat.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("status") ?? ""}
        onValueChange={(value) => apply({ status: value })}
      >
        <SelectTrigger aria-label="Filtrar por estado" className="w-40">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todos los estados</SelectItem>
          {STATUSES.map(({ value, label }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("priority") ?? ""}
        onValueChange={(value) => apply({ priority: value })}
      >
        <SelectTrigger aria-label="Filtrar por prioridad" className="w-40">
          <SelectValue placeholder="Prioridad" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todas las prioridades</SelectItem>
          {PRIORITIES.map(({ value, label }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActive ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => apply({ status: undefined, priority: undefined, category: undefined })}
        >
          <RotateCcwIcon aria-hidden />
          Limpiar
        </Button>
      ) : null}
    </div>
  );
}
