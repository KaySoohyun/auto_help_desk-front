import React from "react";
import { Link } from "react-router-dom";
import { User, Building2, LifeBuoy, ArrowRight, MessageSquareText, ShieldCheck, Zap } from "lucide-react";

const features = [
  { icon: MessageSquareText, title: "Conversación directa", text: "Chat en tiempo real con el equipo asignado a tu caso." },
  { icon: Zap, title: "Respuesta rápida", text: "Seguimiento de incidencias con estados claros y visibles." },
  { icon: ShieldCheck, title: "Seguro y privado", text: "Cada usuario accede únicamente a sus propios tickets." },
];

function PortalCard({ to, icon: Icon, eyebrow, title, description, cta, accent }) {
  return (
    <Link
      to={to}
      className="group relative flex flex-col rounded-3xl border border-border bg-card p-7 sm:p-8 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
    >
      <div
        className="absolute inset-x-0 top-0 h-1 opacity-80"
        style={{ background: accent }}
      />
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
        style={{ backgroundColor: accent + "14", color: accent }}
      >
        <Icon className="w-7 h-7" />
      </div>
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{eyebrow}</span>
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">{description}</p>
      <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-foreground group-hover:gap-3 transition-all">
        {cta}
        <ArrowRight className="w-4 h-4" />
      </span>
    </Link>
  );
}

export default function Landing() {
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
      <section className="mx-auto max-w-6xl px-5 sm:px-8 pt-10 sm:pt-20 pb-10 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Servicio disponible 24/7
        </span>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground leading-[1.05]">
          ¿Cómo podemos <br className="hidden sm:block" /> ayudarte hoy?
        </h1>
        <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
          Selecciona el tipo de acceso para gestionar tus incidencias y recibir soporte del equipo adecuado.
        </p>
      </section>

      {/* Selector */}
      <section className="mx-auto max-w-5xl px-5 sm:px-8 pb-16">
        <div className="grid sm:grid-cols-2 gap-5">
          <PortalCard
            to="/login"
            icon={User}
            eyebrow="Usuarios finales"
            title="Personas"
            description="Soy cliente o usuario. Quiero crear y seguir mis tickets de soporte individuales."
            cta="Acceder como persona"
            accent="#2563eb"
          />
          <PortalCard
            to="/empresas/login"
            icon={Building2}
            eyebrow="Clientes B2B"
            title="Empresas"
            description="Soy gestor o representante. Administro incidencias de varias empresas a la vez."
            cta="Acceder como empresa"
            accent="#059669"
          />
        </div>

        {/* Features */}
        <div className="mt-14 grid sm:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-5">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-3">
                <f.icon className="w-5 h-5 text-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-5 sm:px-8 py-8 border-t border-border text-center">
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Soporte · Centro de incidencias</p>
      </footer>
    </div>
  );
}