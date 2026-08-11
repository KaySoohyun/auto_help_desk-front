"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/stores/session.store";

export function useSessionInitializer() {
  const status = useSessionStore((s) => s.status);
  const loadMe = useSessionStore((s) => s.loadMe);
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated" || status === "refreshing") {
      void loadMe();
    }
  }, [status, loadMe]);

  useEffect(() => {
    if (status === "expired") {
      router.replace("/login?expired=1");
    }
  }, [status, router]);

  return status;
}
