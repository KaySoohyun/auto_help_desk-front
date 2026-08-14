import { create } from "zustand";
import { bffFetch } from "@/lib/api/bffClient";
import { isApiError } from "@/lib/api/errors";
import { toSessionUser, type SessionStatus, type SessionUser, type UserOut } from "@/types/auth.types";

interface LoginCredentials {
  email: string;
  password: string;
  tenant_id?: string;
}

interface SessionStore {
  status: SessionStatus;
  user: SessionUser | null;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  switchTenant: (tenantId: string) => Promise<void>;
  loadMe: () => Promise<void>;
  logout: () => Promise<void>;
  reset: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  status: "unauthenticated",
  user: null,
  error: null,

  login: async ({ email, password, tenant_id }) => {
    set({ status: "authenticating", error: null });
    try {
      const body: { email: string; password: string; tenant_id?: string } = { email, password };
      if (tenant_id) {
        body.tenant_id = tenant_id;
      }
      
      const data = await bffFetch<{ user: UserOut }>("/api/bff/auth/login", {
        method: "POST",
        body,
      });
      set({ status: "authenticated", user: toSessionUser(data.user), error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al iniciar sesión.";
      set({ status: "error", error: message });
      throw err;
    }
  },

  switchTenant: async (tenantId: string) => {
    set({ status: "refreshing", error: null });
    try {
      const data = await bffFetch<{ user: UserOut }>("/api/bff/auth/switch-tenant", {
        method: "POST",
        body: { tenant_id: tenantId },
      });
      set({ status: "authenticated", user: toSessionUser(data.user), error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cambiar de tenant.";
      set({ status: "error", error: message });
      throw err;
    }
  },

  loadMe: async () => {
    set({ status: "refreshing" });
    try {
      const data = await bffFetch<{ user: UserOut }>("/api/bff/me");
      set({ status: "authenticated", user: toSessionUser(data.user), error: null });
    } catch (err) {
      if (isApiError(err) && err.status === 401) {
        set({ status: "expired", user: null, error: null });
      } else {
        set({
          status: "error",
          user: null,
          error: err instanceof Error ? err.message : "Error al cargar la sesión.",
        });
      }
    }
  },

  logout: async () => {
    try {
      await bffFetch("/api/bff/auth/logout", { method: "POST" });
    } finally {
      set({ status: "unauthenticated", user: null, error: null });
    }
  },

  reset: () => {
    set({ status: "unauthenticated", user: null, error: null });
  },
}));
