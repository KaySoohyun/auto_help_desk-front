"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessionInitializer } from "@/hooks/auth/useSessionInitializer";
import { useSessionStore } from "@/stores/session.store";
import { PersonaHeader } from "./PersonaHeader";

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

export function PersonaShell({ slug, children }: { slug: string; children: React.ReactNode }) {
  const router = useRouter();
  const status = useSessionInitializer(`/${slug}/personas/login`);
  const loadMe = useSessionStore((s) => s.loadMe);
  const error = useSessionStore((s) => s.error);
  const user = useSessionStore((s) => s.user);

  // El portal de personas es exclusivo de customer: un agente va a la app de su slug.
  useEffect(() => {
    if (status === "authenticated" && user?.role !== "customer") {
      router.replace(`/${slug}/app`);
    }
  }, [status, user, slug, router]);

  if (status === "refreshing" || status === "unauthenticated") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <PersonaHeader slug={slug} />
        <ShellSkeleton />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <PersonaHeader slug={slug} />
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
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Saltar al contenido
      </a>
      <PersonaHeader slug={slug} />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
    </div>
  );
}
