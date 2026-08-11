export interface DashboardKpis {
  ticketsAsignadosAMi: number;
  ticketsAbiertos: number;
  ticketsSinAsignar: number;
  ticketsSLAEnRiesgo: number;
}

export interface DashboardFilters {
  status?: "open" | "in_progress" | "on_hold" | "closed";
  priority?: "low" | "medium" | "high" | "urgent";
}