"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  ShieldCheckIcon,
  TicketIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui.store";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  enabled: boolean;
  matchPrefix?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Operación",
    items: [
      { href: "/app", label: "Dashboard", icon: LayoutDashboardIcon, enabled: true },
      { href: "/app/tickets", label: "Tickets", icon: TicketIcon, enabled: true },
      {
        href: "/app/knowledge",
        label: "Conocimiento",
        icon: BookOpenIcon,
        enabled: true,
        matchPrefix: true,
      },
    ],
  },
  {
    title: "Gestión",
    items: [
      { href: "/app/audit", label: "Auditoría", icon: ShieldCheckIcon, enabled: false },
      { href: "/app/admin", label: "Administración", icon: SettingsIcon, enabled: false },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200",
        collapsed ? "w-14" : "w-60"
      )}
      aria-label="Navegación principal"
    >
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
          AH
        </div>
        {!collapsed ? (
          <span className="truncate text-sm font-semibold text-foreground">Auto Help Desk</span>
        ) : null}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto p-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            {!collapsed ? (
              <p className="px-2 text-xs font-medium text-muted-foreground">{section.title}</p>
            ) : null}
            {section.items.map((item) => {
              const Icon = item.icon;
              const active =
                item.enabled && (item.matchPrefix ? pathname.startsWith(item.href) : pathname === item.href);

              if (!item.enabled) {
                return (
                  <div
                    key={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground/60 opacity-60",
                      collapsed && "justify-center px-0"
                    )}
                    aria-disabled="true"
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    {!collapsed ? (
                      <span className="flex-1 truncate">
                        {item.label}
                        <span className="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground/50">
                          Próximamente
                        </span>
                      </span>
                    ) : null}
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    collapsed && "justify-center px-0",
                    active
                      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                      : "text-sidebar-foreground"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {!collapsed ? <span className="truncate">{item.label}</span> : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
