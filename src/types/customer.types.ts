export interface Customer {
  id: number;
  tenant_id: string;
  name: string;
  email: string | null;
  company: string | null;
  plan: string | null;
  created_at: string;
}
