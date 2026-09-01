"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangleIcon,
  InboxIcon,
  SearchIcon,
  ShieldAlertIcon,
} from "lucide-react";
import { useAdminCustomers } from "@/hooks/admin/useAdminCustomers";
import { useSessionStore } from "@/stores/session.store";
import { hasAdminPermission } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationControls } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime } from "@/lib/format";

const PAGE_SIZE = 10;

interface CustomerFilter {
  tenantId: string | null;
}

export function AdminCustomersView() {
  const user = useSessionStore((s) => s.user);
  const canRead = hasAdminPermission(user?.role ?? null, "users:read");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [filter, setFilter] = useState<CustomerFilter>({ tenantId: null });
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const offset = (page - 1) * PAGE_SIZE;

  const { data, isLoading, isError, error, refetch } = useAdminCustomers({
    tenantId: filter.tenantId,
    q: debouncedSearch.trim() || undefined,
    limit: PAGE_SIZE,
    offset,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const tenantOptions = user?.tenants ?? [];

  if (!canRead) {
    return (
      <div
        role="alert"
        className="flex items-center gap-2 rounded-lg border border-destructive/60 bg-destructive/40 px-4 py-3 text-sm text-destructive-foreground"
      >
        <ShieldAlertIcon className="size-4" aria-hidden />
        No tenés permiso para acceder a la administración.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Cuentas del portal de personas. El email se muestra enmascarado por privacidad (PII).
        </p>
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
            placeholder="Buscar por nombre"
            aria-label="Buscar clientes por nombre"
            className="w-64 pl-9"
          />
        </div>
        <Select
          value={filter.tenantId ?? "all"}
          onValueChange={(value) => {
            setFilter({ tenantId: value === "all" ? null : value });
            setPage(1);
          }}
        >
          <SelectTrigger aria-label="Filtrar por tenant" className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tenants</SelectItem>
            {tenantOptions.map((tenant) => (
              <SelectItem key={tenant.id} value={tenant.id}>
                {tenant.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-destructive/60 bg-destructive/40 px-4 py-3 text-sm text-destructive-foreground"
        >
          <AlertTriangleIcon className="size-4" aria-hidden />
          {error?.message ?? "No se pudieron cargar los clientes."}
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </div>
      ) : null}

      {!isLoading && !isError ? (
        items.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th scope="col" className="px-3 py-2 font-medium">
                    Nombre
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Email
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Empresa
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Plan
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Registrado
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="px-3 py-2 align-middle text-sm font-medium text-foreground">
                      {c.name}
                    </td>
                    <td className="px-3 py-2 align-middle font-mono text-xs text-muted-foreground">
                      {c.email_masked ?? "—"}
                    </td>
                    <td className="px-3 py-2 align-middle text-sm text-muted-foreground">
                      {c.company ?? "—"}
                    </td>
                    <td className="px-3 py-2 align-middle">
                      {c.plan ? (
                        <Badge variant="outline">{c.plan}</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 align-middle text-sm text-muted-foreground">
                      {formatDateTime(c.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-card p-8 text-center"
            role="status"
          >
            <InboxIcon className="size-8 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium text-foreground">
              {filter.tenantId || debouncedSearch ? "Sin resultados" : "Todavía no hay clientes"}
            </p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Los clientes se crean al registrarse en el portal de personas de la empresa.
            </p>
          </div>
        )
      ) : null}

      {!isLoading && !isError && total > PAGE_SIZE ? (
        <PaginationControls
          total={total}
          limit={PAGE_SIZE}
          offset={offset}
          itemLabel="cliente"
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
}