"use client";

import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicTenants } from "@/hooks/auth/usePublicTenants";

/** Listado de empresas de la landing, con estados de carga y error con reintento. */
export function TenantCompanyList() {
  const { data, isLoading, isError, refetch } = usePublicTenants();

  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <AlertTriangleIcon className="mx-auto size-6 text-muted-foreground" aria-hidden />
        <p className="mt-2 text-sm text-muted-foreground">
          No se pudieron cargar las empresas de demostración.
        </p>
        <Button type="button" variant="outline" className="mt-4 gap-2" onClick={() => void refetch()}>
          <RefreshCwIcon className="size-4" aria-hidden />
          Reintentar
        </Button>
      </div>
    );
  }

  const tenants = data ?? [];

  return (
    <div className="space-y-3">
      {tenants.map((tenant) => (
        <div
          key={tenant.id}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-foreground">{tenant.name}</h3>
            <p className="text-xs text-muted-foreground">/{tenant.slug}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={`/${tenant.slug}/personas/login`}>Portal de personas</a>
            </Button>
            <Button asChild size="sm">
              <a href={`/${tenant.slug}/empresas/login`}>Portal de empresas</a>
            </Button>
          </div>
        </div>
      ))}
      {tenants.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">No hay empresas configuradas.</p>
      ) : null}
    </div>
  );
}
