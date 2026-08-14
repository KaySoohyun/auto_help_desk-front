"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessionInitializer } from "@/hooks/auth/useSessionInitializer";
import { useSessionStore } from "@/stores/session.store";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

function ShellSkeleton() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-md space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const status = useSessionInitializer();
  const loadMe = useSessionStore((s) => s.loadMe);
  const error = useSessionStore((s) => s.error);
  const user = useSessionStore((s) => s.user);

  // El portal de agentes es exclusivo de roles de soporte: un customer va a /panel.
  useEffect(() => {
    if (status === "authenticated" && user?.role === "customer") {
      router.replace("/panel");
    }
  }, [status, user, router]);

  if (status === "refreshing" || status === "unauthenticated") {
    return <ShellSkeleton />;
  }

  if (status === "error") {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-sm space-y-4 text-center">
          <h1 className="text-lg font-semibold text-foreground">No pudimos cargar la sesión</h1>
          <p className="text-sm text-muted-foreground">
            {error ?? "Ocurrió un error inesperado. Intentá de nuevo."}
          </p>
          <Button onClick={() => void loadMe()}>
            <RefreshCwIcon className="size-4" aria-hidden />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Saltar al contenido
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main id="main-content" tabIndex={-1} className="flex-1 p-4 outline-none md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
