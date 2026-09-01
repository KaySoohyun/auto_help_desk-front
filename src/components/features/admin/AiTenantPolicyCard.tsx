"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangleIcon, CheckIcon, Loader2Icon, PlusIcon, SaveIcon, XIcon } from "lucide-react";
import { useAiPolicy } from "@/hooks/admin/useAiPolicy";
import { useUpdateAiPolicy } from "@/hooks/admin/useUpdateAiPolicy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminAiPolicy } from "@/types/admin.types";

function TenantPolicyForm({ policy, disabled }: { policy: AdminAiPolicy; disabled?: boolean }) {
  const updatePolicy = useUpdateAiPolicy();
  const [aiEnabled, setAiEnabled] = useState(policy.ai_enabled);
  const [tone, setTone] = useState(policy.tone);
  const [language, setLanguage] = useState(policy.language);
  const [categories, setCategories] = useState<string[]>(policy.allowed_categories ?? []);
  const [categoriesInput, setCategoriesInput] = useState("");
  const [rules, setRules] = useState<Array<[string, string]>>(Object.entries(policy.escalation_rules ?? {}));

  const addCategory = () => {
    const value = categoriesInput.trim();
    if (!value) return;
    if (categories.some((c) => c.toLowerCase() === value.toLowerCase())) {
      toast.info("La categoría ya está en la lista.");
      return;
    }
    setCategories([...categories, value]);
    setCategoriesInput("");
  };

  const removeCategory = (category: string) => {
    setCategories(categories.filter((c) => c !== category));
  };

  const updateRule = (index: number, key: string, value: string) => {
    setRules(rules.map((rule, i) => (i === index ? [key, value] : rule)));
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const trimmedTone = tone.trim();
    const trimmedLanguage = language.trim();
    if (!trimmedTone || !trimmedLanguage) {
      toast.error("Ingresá un tono y un idioma.");
      return;
    }

    const escalationRules: Record<string, string> = {};
    for (const [key, value] of rules) {
      const trimmedKey = key.trim();
      if (trimmedKey) escalationRules[trimmedKey] = value.trim();
    }

    try {
      const saved = await updatePolicy.mutateAsync({
        ai_enabled: aiEnabled,
        tone: trimmedTone,
        language: trimmedLanguage,
        allowed_categories: categories,
        escalation_rules: escalationRules,
      });
      setAiEnabled(saved.ai_enabled);
      setTone(saved.tone);
      setLanguage(saved.language);
      setCategories(saved.allowed_categories ?? []);
      setRules(Object.entries(saved.escalation_rules ?? {}));
      toast.success("Política IA guardada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la política IA.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Checkbox
          id="ai-enabled"
          checked={aiEnabled}
          onCheckedChange={(checked) => setAiEnabled(checked === true)}
          disabled={disabled}
        />
        <Label htmlFor="ai-enabled">Asistente IA habilitado para el tenant</Label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ai-tone">Tono</Label>
          <Input
            id="ai-tone"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            maxLength={50}
            placeholder="profesional"
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ai-language">Idioma</Label>
          <Input
            id="ai-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            maxLength={10}
            placeholder="es"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ai-categories">Categorías permitidas</Label>
        <div className="flex gap-2">
          <Input
            id="ai-categories"
            value={categoriesInput}
            onChange={(e) => setCategoriesInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCategory();
              }
            }}
            placeholder="Escribí una categoría y presioná Enter"
            disabled={disabled}
          />
          <Button variant="outline" onClick={addCategory} disabled={disabled}>
            <PlusIcon aria-hidden />
            Agregar
          </Button>
        </div>
        {categories.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {categories.map((category) => (
              <Badge key={category} variant="outline">
                {category}
                <button
                  type="button"
                  onClick={() => removeCategory(category)}
                  disabled={disabled}
                  aria-label={`Quitar categoría ${category}`}
                  className="ml-1 rounded-full hover:text-destructive disabled:pointer-events-none"
                >
                  <XIcon className="size-3" aria-hidden />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Sin categorías permitidas.</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Reglas de escalado</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRules([...rules, ["", ""]])}
            disabled={disabled}
          >
            <PlusIcon aria-hidden />
            Agregar regla
          </Button>
        </div>
        {rules.length > 0 ? (
          <div className="space-y-2">
            {rules.map(([key, value], index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={key}
                  onChange={(e) => updateRule(index, e.target.value, value)}
                  placeholder="Clave (ej. urgent)"
                  aria-label={`Clave de la regla ${index + 1}`}
                  disabled={disabled}
                  className="max-w-[220px]"
                />
                <Input
                  value={value}
                  onChange={(e) => updateRule(index, key, e.target.value)}
                  placeholder="Valor (ej. supervisor)"
                  aria-label={`Valor de la regla ${index + 1}`}
                  disabled={disabled}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRule(index)}
                  disabled={disabled}
                  aria-label={`Quitar regla ${index + 1}`}
                >
                  <XIcon className="size-4" aria-hidden />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Sin reglas de escalado.</p>
        )}
      </div>

      {!disabled ? (
        <div className="flex justify-end">
          <Button onClick={() => void handleSave()} disabled={updatePolicy.isPending}>
            {updatePolicy.isPending ? (
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
            ) : (
              <SaveIcon aria-hidden />
            )}
            {updatePolicy.isPending ? "Guardando…" : "Guardar política IA"}
          </Button>
        </div>
      ) : (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <CheckIcon className="size-3.5" aria-hidden />
          Sin permiso para editar la política IA.
        </p>
      )}
    </div>
  );
}

export function AiTenantPolicyCard({ disabled }: { disabled?: boolean }) {
  const { data, isLoading, isError, error, refetch } = useAiPolicy();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Política IA del tenant</CardTitle>
        <CardDescription>
          Habilitación, tono, idioma, categorías y reglas de escalado del asistente.
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
            {error?.message ?? "No se pudo cargar la política IA."}
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Reintentar
            </Button>
          </div>
        ) : null}

        {!isLoading && !isError && data ? (
          <TenantPolicyForm policy={data} disabled={disabled} />
        ) : null}
      </CardContent>
    </Card>
  );
}
