"use client";

import { useRouter } from "next/navigation";
import { LogOutIcon, PanelLeftIcon } from "lucide-react";
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
import { useSessionStore } from "@/stores/session.store";
import { useUiStore } from "@/stores/ui.store";

function initials(email: string): string {
  return email
    .split("@")[0]
    .split(/[._-]/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Topbar() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const logout = useSessionStore((s) => s.logout);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const roleLabel = user ? ROLE_LABELS[user.role] : undefined;

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
                  {initials(user.email)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block">
                <span className="block text-xs font-medium text-foreground">{user.email}</span>
                <span className="block text-[11px] text-muted-foreground">{roleLabel}</span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <span className="block truncate text-sm font-medium">{user.email}</span>
              <span className="block text-xs font-normal text-muted-foreground">{roleLabel}</span>
            </DropdownMenuLabel>
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
