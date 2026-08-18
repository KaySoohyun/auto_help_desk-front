"use client";

import { usePathname } from "next/navigation";

/** Devuelve el slug de empresa desde el primer segmento de la ruta (`/[slug]/...`). */
export function useTenantSlug(): string {
  const pathname = usePathname();
  return pathname.split("/")[1] ?? "";
}
