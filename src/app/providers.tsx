"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { onSessionExpired } from "@/lib/api/sessionEvents";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (failureCount, error) => {
              if (error instanceof Error && "status" in error) {
                const status = (error as { status?: number }).status;
                if (status && (status === 401 || status === 403 || status === 404)) {
                  return false;
                }
              }
              return failureCount < 2;
            },
          },
          mutations: {
            retry: false,
          },
        },
      })
  );

  useEffect(() => {
    return onSessionExpired(() => {
      if (typeof window === "undefined") return;
      const pathname = window.location.pathname;
      const segments = pathname.split("/").filter(Boolean);
      const slug = segments[0] ?? "";
      // Sesión expirada en portal de personas → volver a su login; si no, al de empresas (o landing si no hay slug).
      const target = pathname.startsWith("/panel") && slug
        ? `/${slug}/personas/login?expired=1`
        : slug
          ? `/${slug}/empresas/login?expired=1`
          : "/";
      if (window.location.pathname !== target) {
        // Recarga total intencional: resetea caché y estado tras expirar la sesión.
        window.location.href = target;
      }
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster theme="dark" richColors position="top-right" />
    </QueryClientProvider>
  );
}
