import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmpresasLoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Portal Empresas</h1>
          <p className="text-sm text-muted-foreground">
            Accedé para gestionar los tickets de tus empresas cliente
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Próximamente</h2>
            <p className="text-sm text-muted-foreground">
              El portal de empresas está en desarrollo. Por ahora, podés acceder con tu cuenta de agente.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <Button asChild className="w-full">
              <Link href="/login">Ir al login de agentes</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Volver al inicio</Link>
            </Button>
          </div>
        </div>

        <div className="text-center">
          <Button asChild variant="ghost" size="sm">
            <Link href="/" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Volver a la landing
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
