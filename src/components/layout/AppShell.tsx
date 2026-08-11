"use client";

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
  const status = useSessionInitializer();
  const loadMe = useSessionStore((s) => s.loadMe);
  const error = useSessionStore((s) => s.error);

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
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
