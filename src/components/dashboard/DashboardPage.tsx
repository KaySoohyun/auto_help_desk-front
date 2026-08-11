"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { z } from "zod";

import { useDashboard } from "@/hooks/dashboard/useDashboard";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";

import { AlertTriangle } from "lucide-react";

const filterSchema = z.object({
  status: z.enum(["open", "in_progress", "on_hold", "closed"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
});

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState(() => {
    const raw: Record<string, string> = {};
    for (const [key, value] of searchParams.entries()) {
      raw[key] = value;
    }
    return filterSchema.parse(raw);
  });

  const { data: kpis, isLoading, isError } = useDashboard(filters);

  useEffect(() => {
    const parsed = filterSchema.safeParse(filters);
    if (!parsed.success) return;
    const entries: [string, string][] = [];
    for (const [key, value] of Object.entries(parsed.data)) {
      entries.push([key, value as string]);
    }
    // Build new search params
    const newParams = new URLSearchParams();
    for (const [key, value] of entries) {
      newParams.set(key, value);
    }
    router.push(`?${newParams.toString()}`, { scroll: false });
  }, [filters, router, setFilters]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="h-6 w-24 rounded-lg bg-gray-700/50 flex items-center justify-center text-muted-foreground text-xs">
          loading
        </div>
        <div className="h-6 w-24 rounded-lg bg-gray-700/50 flex items-center justify-center text-muted-foreground text-xs">
          loading
        </div>
        <div className="h-6 w-24 rounded-lg bg-gray-700/50 flex items-center justify-center text-muted-foreground text-xs">
          loading
        </div>
        <div className="h-6 w-24 rounded-lg bg-gray-700/50 flex items-center justify-center text-muted-foreground text-xs">
          loading
        </div>
      </div>
    );
  }

  if (isError || !kpis) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
        <h2 className="text-xl font-medium mb-2">Error</h2>
        <p className="text-muted-foreground">No se pudieron cargar los KPIs.</p>
        <button onClick={() => router.refresh()} className="mt-4 px-4 py-2 bg-primary/20 text-primary hover:bg-primary/30 rounded">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <section className="p-4 md:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          title="Tickets asignados a mí"
          value={kpis.ticketsAsignadosAMi}
          subtitle="Mi cola de trabajo"
        />
        <KpiCard
          title="Tickets abiertos"
          value={kpis.ticketsAbiertos}
          subtitle="Sin atender"
        />
        <KpiCard
          title="Sin asignar"
          value={kpis.ticketsSinAsignar}
          subtitle="Sin dueño"
        />
        <KpiCard
          title="SLA en riesgo"
          value={kpis.ticketsSLAEnRiesgo}
          subtitle="Requiere atención"
        />
      </div>

      <DashboardFilters defaultFilters={{ status: "open", priority: "high" }} />

      <p className="mt-4 text-sm text-muted-foreground">
        Filtros en: {" "}
        <code className="font-mono text-sm">
          /dashboard?status={filters.status ?? ""}&priority={filters.priority ?? ""}
        </code>
      </p>
    </section>
  );
}