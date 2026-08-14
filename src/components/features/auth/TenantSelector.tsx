"use client";

import { useState } from "react";
import { Building2, ChevronRight, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TenantInfo } from "@/types/auth.types";

interface TenantSelectorProps {
  tenants: TenantInfo[];
  onSelect: (tenantId: string) => void;
  onSkip: () => void;
}

export function TenantSelector({ tenants, onSelect, onSkip }: TenantSelectorProps) {
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelect = async (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setIsLoading(true);
    try {
      await onSelect(tenantId);
    } catch {
      setIsLoading(false);
      setSelectedTenantId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Seleccioná tu tenant</h2>
        <p className="text-sm text-muted-foreground">
          Tu cuenta tiene acceso a múltiples tenants. Seleccioná en cuál querés trabajar.
        </p>
      </div>

      <div className="space-y-2">
        {tenants.map((tenant) => (
          <button
            key={tenant.id}
            type="button"
            onClick={() => handleSelect(tenant.id)}
            disabled={isLoading}
            className={`
              w-full flex items-center gap-3 rounded-lg border p-4 text-left transition-all
              ${selectedTenantId === tenant.id
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
              }
              ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            <div className="flex-shrink-0">
              <Building2 className="size-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium">{tenant.name}</div>
              <div className="text-xs text-muted-foreground capitalize">
                {tenant.role.replace("_", " ")}
              </div>
            </div>
            {isLoading && selectedTenantId === tenant.id ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <ChevronRight className="size-4 text-muted-foreground" />
            )}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onSkip}
          disabled={isLoading}
        >
          Continuar sin seleccionar tenant
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Podrás cambiar de tenant más tarde desde el menú de usuario.
        </p>
      </div>
    </div>
  );
}
