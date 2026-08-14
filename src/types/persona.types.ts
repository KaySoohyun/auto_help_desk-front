export interface PersonaProfile {
  id: number;
  name: string;
  email: string | null;
  company: string | null;
  tenant_id: string;
  tenant_name: string;
}
