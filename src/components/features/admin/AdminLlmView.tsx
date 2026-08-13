"use client";

import { ShieldAlertIcon } from "lucide-react";
import { useSessionStore } from "@/stores/session.store";
import { hasAdminPermission } from "@/lib/permissions";
import { AiTenantPolicyCard } from "@/components/features/admin/AiTenantPolicyCard";
import { GlobalAiPolicyCard } from "@/components/features/admin/GlobalAiPolicyCard";
import { OrchestratorInfoCard } from "@/components/features/admin/OrchestratorInfoCard";

export function AdminLlmView() {
  const user = useSessionStore((s) => s.user);
  const canRead = hasAdminPermission(user?.role ?? null, "users:read");
  const canConfigure = hasAdminPermission(user?.role ?? null, "ai:configure");
  const canConfigureGlobal = hasAdminPermission(user?.role ?? null, "ai:configure-global");

  if (!canRead) {
    return (
      <div
        role="alert"
        className="flex items-center gap-2 rounded-lg border border-destructive/60 bg-destructive/40 px-4 py-3 text-sm text-destructive-foreground"
      >
        <ShieldAlertIcon className="size-4" aria-hidden />
        No tenés permiso para acceder a la administración.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Configuración LLM</h1>
        <p className="text-sm text-muted-foreground">
          Políticas de IA, límites y estado del orquestador
        </p>
      </div>

      <AiTenantPolicyCard disabled={!canConfigure} />
      <GlobalAiPolicyCard disabled={!canConfigureGlobal} />
      <OrchestratorInfoCard />
    </div>
  );
}
