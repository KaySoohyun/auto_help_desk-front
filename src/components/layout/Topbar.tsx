"use client";

import { useRouter } from "next/navigation";
import { Building2Icon, CheckIcon, LogOutIcon, PanelLeftIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABELS } from "@/lib/constants/roles";
import { homePathForRole } from "@/lib/auth/routing";
import type { UserRole } from "@/types/auth.types";
import { useSessionStore } from "@/stores/session.store";
import { useUiStore } from "@/stores/ui.store";

function initials(value: string): string {
  return value
    .split(/[@._-]/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Topbar() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const logout = useSessionStore((s) => s.logout);
  const switchTenant = useSessionStore((s) => s.switchTenant);
  const clearTenant = useSessionStore((s) => s.clearTenant);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  const handleSwitchTenant = async (tenantId: string, tenantSlug: string, tenantRole: UserRole) => {
    try {
      await switchTenant(tenantId);
      router.replace(homePathForRole(tenantRole, tenantSlug));
    } catch {
      /* el error queda en el store */
    }
  };

  const handleClearTenant = async () => {
    try {
      await clearTenant();
      router.replace("/");
    } catch {
      /* el error queda en el store */
    }
  };

  const roleLabel = user ? ROLE_LABELS[user.role] : undefined;
  const activeTenantId = user?.tenantId ?? null;
  const activeTenantName =
    user?.tenants.find((t) => t.id === activeTenantId)?.name ?? (activeTenantId ? "Tenant" : undefined);

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur md:px-4">
      <Button variant="ghost" size="icon-sm" onClick={toggleSidebar} aria-label="Alternar barra lateral">
        <PanelLeftIcon className="size-4" aria-hidden />
      </Button>

      <div className="flex-1" />

      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg px-2 py-1 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Menú de usuario"
            >
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                  {initials(user.name || user.email)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block">
                <span className="block max-w-48 truncate text-xs font-medium text-foreground">
                  {user.name || user.email}
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  {roleLabel}
                  {activeTenantName ? ` · ${activeTenantName}` : ""}
                </span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>
              <span className="block truncate text-sm font-medium">{user.name || user.email}</span>
              {user.name ? (
                <span className="block truncate text-xs font-normal text-muted-foreground">{user.email}</span>
              ) : null}
              <span className="block text-xs font-normal text-muted-foreground">{roleLabel}</span>
            </DropdownMenuLabel>

            {user.tenants.length > 0 ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Empresa activa
                  </span>
                </DropdownMenuLabel>

                <DropdownMenuItem
                  onSelect={() => void handleClearTenant()}
                  disabled={activeTenantId === null}
                >
                  <span className="flex-1">Todos los tenants</span>
                  {activeTenantId === null ? <CheckIcon className="size-4" aria-hidden /> : null}
                </DropdownMenuItem>

                {user.tenants.map((tenant) => (
                  <DropdownMenuItem
                    key={tenant.id}
                    onSelect={() =>
                      void (tenant.id === activeTenantId
                        ? undefined
                        : handleSwitchTenant(tenant.id, tenant.slug, tenant.role))
                    }
                    disabled={tenant.id === activeTenantId}
                  >
                    <Building2Icon className="size-4 text-muted-foreground" aria-hidden />
                    <span className="flex-1 truncate">{tenant.name}</span>
                    {tenant.id === activeTenantId ? <CheckIcon className="size-4" aria-hidden /> : null}
                  </DropdownMenuItem>
                ))}
              </>
            ) : null}

            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
              <LogOutIcon className="size-4" aria-hidden />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </header>
  );
}
