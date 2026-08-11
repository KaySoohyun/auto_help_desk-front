"use client";

import { useEffect } from "react";

export function UnregisterLegacyServiceWorker() {
  useEffect(() => {
    void (async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          await reg.unregister();
        }
      } catch {
        // sin soporte de service workers o ya limpiado
      }

      if (typeof caches !== "undefined") {
        try {
          const keys = await caches.keys();
          for (const key of keys) {
            await caches.delete(key);
          }
        } catch {
          // cache no accesible en este contexto
        }
      }
    })();
  }, []);

  return null;
}
