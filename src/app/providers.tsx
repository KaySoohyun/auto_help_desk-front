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
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        // Recarga total intencional: resetea caché y estado tras expirar la sesión.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/login";
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
