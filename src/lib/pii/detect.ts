export interface PiiDetection {
  type: "email" | "phone" | "cuil_cuit";
  count: number;
}

export const PII_LABELS: Record<PiiDetection["type"], string> = {
  email: "Email",
  phone: "Teléfono",
  cuil_cuit: "CUIL/CUIT",
};

const PATTERNS: Array<{ type: PiiDetection["type"]; regex: RegExp }> = [
  { type: "email", regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i },
  {
    type: "phone",
    regex: /\b(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)[\s.-]?)?\d{4}[\s.-]?\d{4}\b/,
  },
  {
    type: "cuil_cuit",
    regex: /\b(?:20|23|24|27|30|33|34)\-?\d{8}\-?\d\b/,
  },
];

/**
 * Detección client-side básica de PII (marca, no redacta).
 * La redacción autoritativa la hace el backend vía /v1/pii/redact.
 */
export function detectPii(text: string): PiiDetection[] {
  const result: PiiDetection[] = [];
  for (const { type, regex } of PATTERNS) {
    const matches = text.match(regex);
    const count = matches?.length ?? 0;
    if (count > 0) result.push({ type, count });
  }
  return result;
}
