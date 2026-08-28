export const CATEGORY_LABELS: Record<string, string> = {
  billing: "Facturación",
  technical: "Soporte técnico",
  account: "Cuenta",
  general: "Consulta general",
  urgent: "Urgente",
  feedback: "Feedback",
  other: "Otro",
};

export function categoryLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return CATEGORY_LABELS[value] ?? value;
}
