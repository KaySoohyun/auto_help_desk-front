"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTenantSlug } from "@/hooks/useTenantSlug";

export function AdminNav() {
  const pathname = usePathname();
  const slug = useTenantSlug();
  const base = `/${slug}/app/admin`;

  const links = [
    { href: `${base}/users`, label: "Usuarios" },
    { href: `${base}/customers`, label: "Clientes" },
    { href: `${base}/llm`, label: "Configuración LLM" },
  ];

  return (
    <nav
      aria-label="Secciones de administración"
      className="flex w-fit items-center gap-1 rounded-lg border border-border bg-card p-1"
    >
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
