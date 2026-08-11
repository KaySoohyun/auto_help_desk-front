export type UserRole = "platform_admin" | "tenant_admin" | "supervisor" | "agent";

export interface UserOut {
  id: number;
  email: string;
  role: UserRole;
  tenant_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export type SessionStatus =
  | "unauthenticated"
  | "authenticating"
  | "mfa_required"
  | "authenticated"
  | "refreshing"
  | "expired"
  | "error";

export interface SessionUser {
  id: number;
  email: string;
  role: UserRole;
  tenantId: string | null;
}

export function toSessionUser(user: UserOut): SessionUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenant_id,
  };
}
