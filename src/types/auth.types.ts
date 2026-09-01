export type UserRole = "platform_admin" | "tenant_admin" | "supervisor" | "agent" | "customer";

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  role: UserRole;
}

export interface UserOut {
  id: number;
  email: string;
  name: string | null;
  role: UserRole;
  tenant_id: string | null;
  is_active: boolean;
  created_at: string;
  tenants: TenantInfo[];
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
  name: string | null;
  role: UserRole;
  tenantId: string | null;
  tenants: TenantInfo[];
}

export function toSessionUser(user: UserOut): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenant_id,
    tenants: user.tenants || [],
  };
}
