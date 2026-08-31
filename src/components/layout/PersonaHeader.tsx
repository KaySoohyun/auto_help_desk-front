"use client";

import { useRouter } from "next/navigation";
import { LogOutIcon, LifeBuoy } from "lucide-react";
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
import { useSessionStore } from "@/stores/session.store";

function initials(email: string): string {
  return email
    .split("@")[0]
    .split(/[._-]/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function PersonaHeader({ slug }: { slug: string }) {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const logout = useSessionStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
          <LifeBuoy className="h-5 w-5 text-primary-foreground" aria-hidden />
        </div>
        <div className="leading-tight">
          <span className="block text-base font-semibold tracking-tight text-foreground">Help Desk</span>
          <span className="block text-[11px] text-muted-foreground">Portal de personas</span>
        </div>
      </div>

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
              <span className="hidden sm:block">
                <span className="block max-w-44 truncate text-xs font-medium text-foreground">{user.email}</span>
                <span className="block text-[11px] text-muted-foreground">Cliente</span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <span className="block truncate text-sm font-medium">{user.email}</span>
              <span className="block text-xs font-normal text-muted-foreground">Cliente</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
              <LogOutIcon className="size-4" aria-hidden />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button size="sm" onClick={() => router.replace(`/${slug}/personas/login`)}>
          Ingresar
        </Button>
      )}
    </header>
  );
}
