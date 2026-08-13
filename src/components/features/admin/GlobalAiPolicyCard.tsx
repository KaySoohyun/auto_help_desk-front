"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangleIcon, CheckIcon, Loader2Icon, SaveIcon } from "lucide-react";
import { useGlobalAiPolicy } from "@/hooks/admin/useGlobalAiPolicy";
import { useUpdateGlobalAiPolicy } from "@/hooks/admin/useUpdateGlobalAiPolicy";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { GlobalAiPolicy } from "@/types/admin.types";

function GlobalPolicyForm({ policy, disabled }: { policy: GlobalAiPolicy; disabled?: boolean }) {
  const updatePolicy = useUpdateGlobalAiPolicy();
  const [model, setModel] = useState(policy.llm_model);
  const [threshold, setThreshold] = useState(String(policy.ai_confidence_threshold));
  const [guardrails, setGuardrails] = useState(policy.guardrails_enabled);
  const [rateCalls, setRateCalls] = useState(String(policy.llm_rate_max_calls));

  const handleSave = async () => {
    const parsedThreshold = Number(threshold);
    const parsedRate = Number.parseInt(rateCalls, 10);
    if (!model.trim()) {
      toast.error("Ingresá un modelo.");
      return;
    }
    if (Number.isNaN(parsedThreshold) || parsedThreshold < 0 || parsedThreshold > 1) {
      toast.error("El umbral de confianza debe estar entre 0 y 1.");
      return;
    }
    if (Number.isNaN(parsedRate) || parsedRate < 1) {
      toast.error("El límite de llamadas debe ser mayor o igual a 1.");
      return;
    }

    try {
      const saved = await updatePolicy.mutateAsync({
        llm_model: model.trim(),
        ai_confidence_threshold: parsedThreshold,
        guardrails_enabled: guardrails,
        llm_rate_max_calls: parsedRate,
      });
      setModel(saved.llm_model);
      setThreshold(String(saved.ai_confidence_threshold));
      setGuardrails(saved.guardrails_enabled);
      setRateCalls(String(saved.llm_rate_max_calls));
      toast.success("Política global guardada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la política global.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="global-model">Modelo</Label>
          <Input
            id="global-model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            maxLength={100}
            placeholder="gpt-4o-mini"
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="global-threshold">Umbral de confianza (0–1)</Label>
          <Input
            id="global-threshold"
            type="number"
            min={0}
            max={1}
            step={0.05}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="global-guardrails"
          checked={guardrails}
          onCheckedChange={(checked) => setGuardrails(checked === true)}
          disabled={disabled}
        />
        <Label htmlFor="global-guardrails">Guardrails habilitados</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="global-rate">Límite de llamadas LLM por ventana</Label>
        <Input
          id="global-rate"
          type="number"
          min={1}
          step={1}
          value={rateCalls}
          onChange={(e) => setRateCalls(e.target.value)}
          disabled={disabled}
          className="max-w-[220px]"
        />
      </div>

      {!disabled ? (
        <div className="flex justify-end">
          <Button onClick={() => void handleSave()} disabled={updatePolicy.isPending}>
            {updatePolicy.isPending ? (
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
            ) : (
              <SaveIcon aria-hidden />
            )}
            {updatePolicy.isPending ? "Guardando…" : "Guardar política global"}
          </Button>
        </div>
      ) : (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <CheckIcon className="size-3.5" aria-hidden />
          Solo un administrador de plataforma puede editar la política global.
        </p>
      )}
    </div>
  );
}

export function GlobalAiPolicyCard({ disabled }: { disabled?: boolean }) {
  const { data, isLoading, isError, error, refetch } = useGlobalAiPolicy();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Política global LLM</CardTitle>
        <CardDescription>
          Modelo, umbral de confianza, guardrails y límite de llamadas del orquestador.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
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
            {error?.message ?? "No se pudo cargar la política global."}
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Reintentar
            </Button>
          </div>
        ) : null}

        {!isLoading && !isError && data ? (
          <GlobalPolicyForm policy={data} disabled={disabled} />
        ) : null}
      </CardContent>
    </Card>
  );
}
