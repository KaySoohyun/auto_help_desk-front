import type { UserOut, UserRole } from "@/types/auth.types";

export type AdminUser = UserOut;

export interface AdminUserCreatePayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  tenant_id?: string;
}

export interface AdminUserUpdatePayload {
  role?: UserRole;
  is_active?: boolean;
  name?: string;
}

export interface AdminUserListQuery {
  q?: string;
  role?: UserRole | "all";
  limit?: number;
  offset?: number;
}

export interface AdminUserList {
  items: AdminUser[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminCustomer {
  id: number;
  tenant_id: string;
  name: string;
  email_masked: string | null;
  company: string | null;
  plan: string | null;
  created_at: string;
}

export interface AdminCustomerList {
  items: AdminCustomer[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminAiPolicy {
  tenant_id: string | null;
  ai_enabled: boolean;
  tone: string;
  language: string;
  allowed_categories: string[];
  escalation_rules: Record<string, string>;
  updated_at: string;
}

export interface AdminAiPolicyUpdate {
  ai_enabled?: boolean;
  tone?: string;
  language?: string;
  allowed_categories?: string[];
  escalation_rules?: Record<string, string>;
}

export interface GlobalAiPolicy {
  llm_model: string;
  ai_confidence_threshold: number;
  guardrails_enabled: boolean;
  llm_rate_max_calls: number;
}

export interface GlobalAiPolicyUpdate {
  llm_model?: string;
  ai_confidence_threshold?: number;
  guardrails_enabled?: boolean;
  llm_rate_max_calls?: number;
}

export interface OrchestratorInfo {
  provider: string;
  model: string;
  rate_max_calls: number;
  rate_window_seconds: number;
  max_retries: number;
}
