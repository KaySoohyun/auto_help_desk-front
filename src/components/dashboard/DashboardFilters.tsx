"use client";

import { useEffect, useState } from "react";
import { z } from "zod";

const filterSchema = z.object({
  status: z.enum(["open", "in_progress", "on_hold", "closed"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
});

export interface DashboardFiltersProps {
  defaultFilters?: Partial<z.infer<typeof filterSchema>>;
}

export function DashboardFilters({ defaultFilters }: DashboardFiltersProps = {}) {
  const [appliedFilters] = useState(() => {
    if (defaultFilters) {
      return filterSchema.parse(defaultFilters);
    }
    return { status: undefined, priority: undefined } as const;
  });

  useEffect(() => {
    // Sincronizar con URL cuando cambian los filtros aplicados
    const searchParams = new URLSearchParams();
    if (appliedFilters.status) searchParams.set("status", appliedFilters.status);
    if (appliedFilters.priority) searchParams.set("priority", appliedFilters.priority);
    // Note: URL navigation handled por parent DashboardPage
  }, [appliedFilters]);

  return null;
}