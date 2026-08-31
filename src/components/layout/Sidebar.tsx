"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenIcon,
  SettingsIcon,
  ShieldCheckIcon,
  TicketIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui.store";
import { useSessionStore } from "@/stores/session.store";
import { hasAdminPermission, hasAuditPermission } from "@/lib/permissions";

interface NavItem {
  key: string;
  href: string;
  label: string;
  icon: LucideIcon;
  enabled: boolean | "admin" | "audit";
  matchPrefix?: boolean;
}

interface SidebarProps {
  slug: string;
}

export function Sidebar({ slug }: SidebarProps) {
  const pathname = usePathname();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const user = useSessionStore((s) => s.user);
  const canAdmin = hasAdminPermission(user?.role ?? null, "users:read");
  const canAudit = hasAuditPermission(user?.role ?? null, "audit:view");
  const base = `/${slug}/app`;

  const navSections: { title: string; items: NavItem[] }[] = [
    {
      title: "Operación",
      items: [
        { key: "tickets", href: `${base}/tickets`, label: "Tickets", icon: TicketIcon, enabled: true },
        {
          key: "knowledge",
          href: `${base}/knowledge`,
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
        {
          key: "audit",
          href: `${base}/audit`,
          label: "Auditoría",
          icon: ShieldCheckIcon,
          enabled: "audit",
          matchPrefix: true,
        },
        {
          key: "admin",
          href: `${base}/admin`,
          label: "Administración",
          icon: SettingsIcon,
          enabled: "admin",
          matchPrefix: true,
        },
      ],
    },
  ];

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
        {navSections.map((section) => {
          const items = section.items.filter((item) => {
            if (item.enabled === "admin") return canAdmin;
            if (item.enabled === "audit") return canAudit;
            return item.enabled;
          });
          if (items.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1">
              {!collapsed ? (
                <p className="px-2 text-xs font-medium text-muted-foreground">{section.title}</p>
              ) : null}
              {items.map((item) => {
                const Icon = item.icon;
                const active = item.matchPrefix
                  ? pathname.startsWith(item.href)
                  : pathname === item.href;

                return (
                  <Link
                    key={item.key}
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
          );
        })}
      </nav>
    </aside>
  );
}
