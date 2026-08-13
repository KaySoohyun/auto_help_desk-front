"use client";

import { AlertTriangleIcon, RefreshCcwIcon } from "lucide-react";
import { useAiInfo } from "@/hooks/admin/useAiInfo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-border py-2 text-sm last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}

export function OrchestratorInfoCard() {
  const { data, isLoading, isError, error, refetch } = useAiInfo();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado del orquestador</CardTitle>
        <CardDescription>Configuración actual del proveedor LLM y sus límites (solo lectura).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : null}

        {isError ? (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-destructive/60 bg-destructive/40 px-4 py-3 text-sm text-destructive-foreground"
          >
            <AlertTriangleIcon className="size-4" aria-hidden />
            {error?.message ?? "No se pudo cargar la información del orquestador."}
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Reintentar
            </Button>
          </div>
        ) : null}

        {!isLoading && !isError && data ? (
          <>
            <dl>
              <InfoRow label="Proveedor" value={data.provider} />
              <InfoRow label="Modelo" value={data.model} />
              <InfoRow label="Máx. llamadas por ventana" value={String(data.rate_max_calls)} />
              <InfoRow label="Ventana (segundos)" value={String(data.rate_window_seconds)} />
              <InfoRow label="Reintentos máximos" value={String(data.max_retries)} />
            </dl>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => void refetch()} disabled={isLoading}>
                <RefreshCcwIcon aria-hidden />
                Actualizar
              </Button>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
