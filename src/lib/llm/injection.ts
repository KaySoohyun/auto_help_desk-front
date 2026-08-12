import type { LlmRisk } from "@/types/llm.types";

const INJECTION_PATTERNS: RegExp[] = [
  /ignora(?:\s+las?\s+|\s+todas\s+|\s+todo\s+)?(?:instrucciones|ordenes|reglas|prompt|lo\s+anterior)/i,
  /olvida(?:\s+todo\s+)?lo\s+(?:anterior|dicho)/i,
  /(?:desde\s+ahora|ahora\s+eres|ahora\s+sos)\s+(?:un?\s+)?administrador/i,
  /actua\s+como\s+administrador/i,
  /ignora\s+el\s+(?:prompt\s+)?(?:de\s+)?sistema/i,
  /revela\s+(?:el\s+)?(?:prompt|sistema|instrucciones)/i,
  /dame\s+(?:el\s+)?(?:system\s+)?prompt/i,
  /libera\s+tokens/i,
  /eleva\s+(?:tus\s+)?permisos/i,
  /ejecuta\s+este\s+comando/i,
  /ignore\s+(?:all\s+)?previous\s+instructions/i,
  /disregard\s+(?:all\s+)?previous\s+instructions/i,
  /forget\s+(?:everything|all)\s+(?:you|your|previous)/i,
  /you\s+are\s+now\s+(?:an?\s+)?admin(?:istrator)?/i,
  /reveal\s+(?:your\s+)?(?:system\s+)?prompt/i,
];

export const INJECTION_RISK_MESSAGE =
  "Se detectó posible contenido malicioso en el ticket. Se recomienda revisión manual y no aplicar sugerencias automáticamente.";

function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function detectPromptInjection(text: string | null | undefined): LlmRisk | null {
  if (!text || text.trim().length === 0) return null;
  const normalized = stripAccents(text);
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        kind: "prompt_injection",
        level: "high",
        message: INJECTION_RISK_MESSAGE,
      };
    }
  }
  return null;
}
