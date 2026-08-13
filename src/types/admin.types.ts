import type { UserOut, UserRole } from "@/types/auth.types";

export type AdminUser = UserOut;

export interface AdminUserCreatePayload {
  email: string;
  password: string;
  role: UserRole;
  tenant_id?: string;
}

export interface AdminUserUpdatePayload {
  role?: UserRole;
  is_active?: boolean;
}

export interface AdminUserListQuery {
  limit?: number;
  offset?: number;
}
