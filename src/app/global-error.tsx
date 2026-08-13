"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface GlobalErrorProps {
  error: Error & { correlationId?: string };
  reset: () => void;
}

const palette = {
  background: "#161f1a",
  foreground: "#efeae1",
  muted: "#97a29b",
  primary: "#d19a66",
  destructive: "#e05c5c",
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Error global de aplicación", error.correlationId ?? "sin id de correlación", error);
  }, [error]);

  return (
    <html lang="es" className="dark h-full">
      <body
        className="min-h-full flex flex-col antialiased"
        style={{ background: palette.background, color: palette.foreground }}
      >
        <main
          role="alert"
          className="flex flex-1 flex-col items-center justify-center p-6 text-center"
        >
          <AlertTriangle className="w-12 h-12 mb-4" color={palette.destructive} />
          <h1 className="text-xl font-medium mb-2">Algo salió mal</h1>
          <p className="mb-4" style={{ color: palette.muted }}>
            Ocurrió un error inesperado. Recargá la página para reintentar.
          </p>
          <p className="font-mono text-xs mb-6" style={{ color: palette.muted }}>
            ID de error: {error.correlationId ?? "desconocido"}
          </p>
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 rounded"
            style={{ background: "rgba(209, 154, 102, 0.2)", color: palette.primary }}
          >
            Recargar
          </button>
        </main>
      </body>
    </html>
  );
}
