"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangleIcon,
  InboxIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  ShieldAlertIcon,
} from "lucide-react";
import { useAdminUsers } from "@/hooks/admin/useAdminUsers";
import { useSessionStore } from "@/stores/session.store";
import { hasAdminPermission } from "@/lib/permissions";
import { UserCreateForm } from "@/components/features/admin/UserCreateForm";
import { UserEditDialog } from "@/components/features/admin/UserEditDialog";
import { ROLE_LABELS } from "@/components/features/admin/roleLabels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime } from "@/lib/format";
import type { AdminUser } from "@/types/admin.types";
import type { UserRole } from "@/types/auth.types";

const ROLE_FILTERS: Array<UserRole | "all"> = ["all", "tenant_admin", "supervisor", "agent", "platform_admin"];

export function AdminUsersView() {
  const user = useSessionStore((s) => s.user);
  const canRead = hasAdminPermission(user?.role ?? null, "users:read");
  const canEdit = hasAdminPermission(user?.role ?? null, "users:edit");
  const isPlatformAdmin = user?.role === "platform_admin";

  const { data: users, isLoading, isError, error, refetch } = useAdminUsers({ limit: 200 });

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (users ?? []).filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (q && !u.email.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [users, search, roleFilter]);

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Usuarios</h1>
          <p className="text-sm text-muted-foreground">Gestión de usuarios del tenant</p>
        </div>
        {canEdit ? (
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon aria-hidden />
            Nuevo usuario
          </Button>
        ) : null}
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
            placeholder="Buscar por email"
            aria-label="Buscar por email"
            className="w-64 pl-9"
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(value) => setRoleFilter(value as UserRole | "all")}
        >
          <SelectTrigger aria-label="Filtrar por rol" className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_FILTERS.map((role) => (
              <SelectItem key={role} value={role}>
                {role === "all" ? "Todos los roles" : ROLE_LABELS[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          {error?.message ?? "No se pudieron cargar los usuarios."}
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </div>
      ) : null}

      {!isLoading && !isError ? (
        items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th scope="col" className="px-3 py-2 font-medium">
                    Email
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Rol
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Estado
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Creado
                  </th>
                  {canEdit ? (
                    <th scope="col" className="px-3 py-2 text-right font-medium">
                      Acciones
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="px-3 py-2 align-middle text-sm text-foreground">{u.email}</td>
                    <td className="px-3 py-2 align-middle">
                      <Badge variant="outline">{ROLE_LABELS[u.role]}</Badge>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      {u.is_active ? (
                        <Badge>Activo</Badge>
                      ) : (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2 align-middle text-sm text-muted-foreground whitespace-nowrap">
                      {formatDateTime(u.created_at)}
                    </td>
                    {canEdit ? (
                      <td className="px-3 py-2 align-middle text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditing(u)}
                        >
                          <PencilIcon aria-hidden />
                          Editar
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-12 text-center">
            <InboxIcon className="size-8 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">No hay usuarios para mostrar.</p>
          </div>
        )
      ) : null}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo usuario</DialogTitle>
            <DialogDescription>Creá un usuario dentro del tenant.</DialogDescription>
          </DialogHeader>
          <UserCreateForm
            isPlatformAdmin={isPlatformAdmin}
            onSaved={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {editing ? (
        <UserEditDialog
          user={editing}
          open={editing !== null}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          isPlatformAdmin={isPlatformAdmin}
        />
      ) : null}
    </div>
  );
}
