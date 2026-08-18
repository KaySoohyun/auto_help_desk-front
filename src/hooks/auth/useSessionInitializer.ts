"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/stores/session.store";

export function useSessionInitializer(loginPath = "/") {
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
      router.replace(`${loginPath}?expired=1`);
    }
  }, [status, router, loginPath]);

  return status;
}
