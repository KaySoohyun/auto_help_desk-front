"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSessionStore } from "@/stores/session.store";
import { homePathForRole } from "@/lib/auth/routing";
import type { TenantInfo } from "@/types/auth.types";
import type { Tenant } from "@/types/tenant.types";
import { TenantSelector } from "./TenantSelector";

const loginSchema = z.object({
  email: z.string().trim().min(1, "Ingresá tu email.").email("Email inválido."),
  password: z.string().min(1, "Ingresá tu contraseña."),
});

type LoginValues = z.infer<typeof loginSchema>;

export interface LoginFormProps {
  /** Tenant resuelto desde el slug de la URL: se manda como tenant_id en el login. */
  tenant?: Pick<Tenant, "id" | "slug">;
}

export function LoginForm({ tenant }: LoginFormProps) {
  const router = useRouter();
  const login = useSessionStore((s) => s.login);
  const switchTenant = useSessionStore((s) => s.switchTenant);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showTenantSelector, setShowTenantSelector] = useState(false);
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const slug = tenant?.slug ?? "";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginValues) => {
    setServerError(null);
    try {
      await login({ ...values, tenant_id: tenant?.id });

      // Después del login, verificar si el usuario tiene múltiples tenants
      const currentUser = useSessionStore.getState().user;
      if (currentUser && currentUser.tenants && currentUser.tenants.length > 1) {
        setTenants(currentUser.tenants);
        setShowTenantSelector(true);
      } else {
        router.replace(currentUser ? homePathForRole(currentUser.role, slug) : "/");
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Error al iniciar sesión.");
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
          placeholder="agente@example.com"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
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
          autoComplete="current-password"
          placeholder="••••••••"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...register("password")}
        />
        {errors.password ? (
          <p id="password-error" className="text-xs text-destructive">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2Icon className="size-4 animate-spin" aria-hidden /> : null}
        {isSubmitting ? "Ingresando…" : "Ingresar"}
      </Button>
    </form>
  );
}
