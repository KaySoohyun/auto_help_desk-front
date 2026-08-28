import { LifeBuoy } from "lucide-react";
import { TenantCompanyList } from "@/components/landing/TenantCompanyList";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="mx-auto max-w-6xl px-5 sm:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <LifeBuoy className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-base font-semibold tracking-tight text-foreground">Soporte</span>
        </div>
        <span className="text-xs text-muted-foreground hidden sm:block">Centro de incidencias</span>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 sm:px-8 pt-10 sm:pt-16 pb-10 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Demo · Multi-tenant
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.05]">
          Elegí una empresa para <br className="hidden sm:block" /> empezar
        </h1>
        <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
          Sistema de soporte multi-tenant. Cada empresa tiene su propio portal de clientes y de soporte para gestionar tickets. Seleccioná una para probar la demo.
        </p>
      </section>

      {/* Selector de empresas */}
      <section className="mx-auto max-w-3xl px-5 sm:px-8 pb-16">
        <TenantCompanyList />
      </section>

      <footer className="mx-auto max-w-6xl px-5 sm:px-8 py-8 border-t border-border text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Help Desk · Centro de incidencias
        </p>
      </footer>
    </div>
  );
}
