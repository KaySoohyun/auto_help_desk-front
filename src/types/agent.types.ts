/** Agente de un tenant (feature 018), del endpoint `GET /v1/agents`. */
export interface Agent {
  id: number;
  name: string | null;
  email: string;
  role: string;
  is_active: boolean;
}