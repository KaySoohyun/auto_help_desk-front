"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface AppErrorProps {
  error: Error & { correlationId?: string };
  reset: () => void;
}

export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    console.error("Error de aplicación", error.correlationId ?? "sin id de correlación", error);
  }, [error]);

  return (
    <main
      role="alert"
      className="min-h-full flex flex-col items-center justify-center p-6 text-center"
    >
      <AlertTriangle className="w-12 h-12 mb-4 text-destructive" />
      <h1 className="text-xl font-medium mb-2">Algo salió mal</h1>
      <p className="text-muted-foreground mb-4">
        Ocurrió un error inesperado. Recargá la página para reintentar.
      </p>
      <p className="font-mono text-xs text-muted-foreground mb-6">
        ID de error: {error.correlationId ?? "desconocido"}
      </p>
      <button
        type="button"
        onClick={reset}
        className="px-4 py-2 bg-primary/20 text-primary hover:bg-primary/30 rounded"
      >
        Recargar
      </button>
    </main>
  );
}
