"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { homePathForRole } from "@/lib/auth/routing";
import { useSessionStore } from "@/stores/session.store";
import {
  DEMO_SUPPORT_USERS,
  demoCustomerEmail,
  type DemoUser,
} from "@/lib/auth/demo-users";
import type { Tenant } from "@/types/tenant.types";

interface DemoLoginButtonsProps {
  /** customer → botón "cliente demo"; support → botones por rol del equipo soporte. */
  mode: "customer" | "support";
  tenant: Pick<Tenant, "id" | "slug" | "name">;
}

function demoLabel(user: DemoUser): string {
  switch (user.role) {
    case "agent":
      return "Entrar como agente";
    case "supervisor":
      return "Entrar como supervisor";
    case "tenant_admin":
      return "Entrar como admin de empresa";
    case "platform_admin":
      return "Entrar como admin de plataforma";
    case "customer":
      return "Entrar como cliente demo";
  }
}

export function DemoLoginButtons({ mode, tenant }: DemoLoginButtonsProps) {
  const router = useRouter();
  const login = useSessionStore((s) => s.login);
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (user: DemoUser) => {
    setError(null);
    setLoadingEmail(user.email);
    try {
      await login({
        email: user.email,
        password: user.password,
        tenant_id: user.tenantScoped ? tenant.id : undefined,
      });
      const currentUser = useSessionStore.getState().user;
      router.replace(currentUser ? homePathForRole(currentUser.role, tenant.slug) : "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo ingresar con la cuenta demo.");
    } finally {
      setLoadingEmail(null);
    }
  };

  const options: DemoUser[] =
    mode === "customer"
      ? [
        {
          role: "customer",
          email: demoCustomerEmail(tenant.slug),
          password: "demo-pass-123",
          tenantScoped: true,
        },
      ]
      : DEMO_SUPPORT_USERS;

  return (
    <div className="space-y-3">
      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/60 bg-destructive/40 px-3 py-2 text-xs font-medium text-destructive-foreground"
        >
          {error}
        </div>
      ) : null}

      <div className="grid gap-2">
        {options.map((user) => {
          const loading = loadingEmail === user.email;
          return (
            <Button
              key={user.email}
              type="button"
              variant="outline"
              className="w-full justify-start"
              disabled={loadingEmail !== null && !loading}
              onClick={() => void handleLogin(user)}
            >
              {loading ? <Loader2Icon className="size-4 animate-spin" aria-hidden /> : null}
              {demoLabel(user)}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
