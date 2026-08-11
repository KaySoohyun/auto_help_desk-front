"use client";

import { useSearchParams } from "next/navigation";

export function SessionExpiredNotice() {
  const searchParams = useSearchParams();
  if (searchParams.get("expired") !== "1") return null;

  return (
    <div
      role="alert"
      className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-300"
    >
      Tu sesión expiró. Ingresá nuevamente para continuar.
    </div>
  );
}
