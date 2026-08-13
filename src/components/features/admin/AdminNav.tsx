"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/app/admin/users", label: "Usuarios" },
  { href: "/app/admin/llm", label: "Configuración LLM" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Secciones de administración"
      className="flex w-fit items-center gap-1 rounded-lg border border-border bg-card p-1"
    >
      {LINKS.map((link) => {
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
