"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSessionStore } from "@/stores/session.store";
import { homePathForRole } from "@/lib/auth/routing";
import { usePublicTenants } from "@/hooks/auth/usePublicTenants";
import type { TenantInfo } from "@/types/auth.types";
import type { Tenant } from "@/types/tenant.types";
import { TenantSelector } from "./TenantSelector";

const registerSchema = z.object({
  email: z.string().trim().min(1, "Ingresá tu email.").email("Email inválido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

type RegisterValues = z.infer<typeof registerSchema>;

export interface RegisterFormProps {
  /** Rol a registrar: agent (empresas) o customer (personas). */
  role?: "agent" | "customer";
  /** Exige seleccionar al menos un tenant (necesario para customers). */
  requireTenant?: boolean;
  /** Tenant resuelto desde el slug: se preselecciona en el selector. */
  tenant?: Pick<Tenant, "id" | "slug">;
}

export function RegisterForm({ role = "agent", requireTenant = false, tenant }: RegisterFormProps) {
  const router = useRouter();
  const register = useSessionStore((s) => s.register);
  const switchTenant = useSessionStore((s) => s.switchTenant);
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedTenants, setSelectedTenants] = useState<string[]>(tenant ? [tenant.id] : []);
  const [showTenantSelector, setShowTenantSelector] = useState(false);
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const slug = tenant?.slug ?? "";

  const { data: publicTenants, isLoading, isError, refetch } = usePublicTenants();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  const toggleTenant = (tenantId: string) => {
    setSelectedTenants((prev) =>
      prev.includes(tenantId) ? prev.filter((id) => id !== tenantId) : [...prev, tenantId]
    );
  };

  const onSubmit = async (values: RegisterValues) => {
    setServerError(null);
    if (requireTenant && selectedTenants.length === 0) {
      setServerError("Seleccioná al menos una empresa/tenant para continuar.");
      return;
    }
    try {
      await register({ email: values.email, password: values.password, role, tenant_ids: selectedTenants });

      const currentUser = useSessionStore.getState().user;
      if (currentUser && currentUser.tenants.length > 1) {
        setTenants(currentUser.tenants);
        setShowTenantSelector(true);
      } else {
        router.replace(currentUser ? homePathForRole(currentUser.role, slug) : "/");
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Error al registrarte.");
    }
  };

  const handleTenantSelect = async (tenantId: string) => {
    setServerError(null);
    try {
      await switchTenant(tenantId);
      const currentUser = useSessionStore.getState().user;
      router.replace(currentUser ? homePathForRole(currentUser.role, slug) : "/");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Error al cambiar de tenant.");
    }
  };

  const handleSkipTenantSelection = () => {
    const currentUser = useSessionStore.getState().user;
    router.replace(currentUser ? homePathForRole(currentUser.role, slug) : "/");
  };

  if (showTenantSelector) {
    return (
      <TenantSelector
        tenants={tenants}
        onSelect={handleTenantSelect}
        onSkip={handleSkipTenantSelection}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/60 bg-destructive/40 px-3 py-2 text-sm font-medium text-destructive-foreground"
        >
          {serverError}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="tunombre@empresa.com"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...registerField("email")}
        />
        {errors.email ? (
          <p id="email-error" className="text-xs text-destructive">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...registerField("password")}
        />
        {errors.password ? (
          <p id="password-error" className="text-xs text-destructive">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium" id="tenants-label">
          Empresas / tenants
        </span>
        <p className="text-xs text-muted-foreground">
          Elegí una o varias empresas. Podés cambiar esto más tarde o ver los tickets de todas.
        </p>

        {isLoading ? (
          <div className="space-y-2" aria-busy="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-9 animate-pulse rounded-lg border border-border bg-muted/40" />
            ))}
          </div>
        ) : isError ? (
          <div className="space-y-2">
            <p className="text-xs text-destructive">No se pudieron cargar las empresas.</p>
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
              Reintentar
            </Button>
          </div>
        ) : (
          <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-border p-2" role="group" aria-labelledby="tenants-label">
            {(publicTenants ?? []).map((tenant) => {
              const checked = selectedTenants.includes(tenant.id);
              return (
                <label
                  key={tenant.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted/60"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleTenant(tenant.id)}
                    aria-label={`Asociar a ${tenant.name}`}
                  />
                  <Building2 className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="truncate">{tenant.name}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2Icon className="size-4 animate-spin" aria-hidden /> : null}
        {isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
      </Button>
    </form>
  );
}
