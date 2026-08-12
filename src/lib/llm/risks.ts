import type { LlmRisk, LlmRiskEvaluation, LlmRiskKind, LlmRiskLevel } from "@/types/llm.types";
import { confidenceLevel } from "@/lib/llm/confidence";
import type { PiiDetection } from "@/lib/pii/detect";

const RISK_PRIORITY: Record<LlmRiskKind, number> = {
  prompt_injection: 6,
  hallucination: 5,
  pii: 4,
  insufficient_context: 3,
  low_confidence: 2,
  policy: 1,
  warning: 0,
};

const LEVEL_PRIORITY: Record<LlmRiskLevel, number> = {
  high: 2,
  medium: 1,
  low: 0,
};

export interface EvaluateLlmRisksArgs {
  confidence?: number | null;
  warnings?: string[] | null;
  policyFlags?: string[] | null;
  piiDetections?: PiiDetection[] | null;
  injectionRisk?: LlmRisk | null;
  insufficientContext?: boolean;
}

export function hasBlockingRisk(risks: LlmRisk[]): boolean {
  return risks.some((risk) => risk.kind === "prompt_injection" && risk.level === "high");
}

export function evaluateLlmRisks({
  confidence,
  warnings,
  policyFlags,
  piiDetections,
  injectionRisk,
  insufficientContext,
}: EvaluateLlmRisksArgs): LlmRiskEvaluation {
  const risks: LlmRisk[] = [];

  if (typeof confidence === "number") {
    if (confidenceLevel(confidence) === "low") {
      risks.push({
        kind: "low_confidence",
        level: "low",
        message: "Confianza baja. Verificá antes de usar esta sugerencia.",
      });
    }
  }

  for (const warning of warnings ?? []) {
    if (!warning.trim()) continue;
    risks.push({ kind: "warning", level: "medium", message: warning });
  }

  for (const flag of policyFlags ?? []) {
    if (!flag.trim()) continue;
    risks.push({ kind: "policy", level: "medium", message: `Política: ${flag}` });
  }

  const totalPii = (piiDetections ?? []).reduce((sum, detection) => sum + detection.count, 0);
  if (totalPii > 0) {
    risks.push({
      kind: "pii",
      level: "medium",
      message:
        "Se detectó información sensible en el borrador. Revisá la redacción antes de enviar.",
    });
  }

  if (injectionRisk) risks.push(injectionRisk);

  if (insufficientContext) {
    risks.push({
      kind: "insufficient_context",
      level: "medium",
      message:
        "No hay suficiente contexto para una sugerencia confiable. Revisá manualmente.",
    });
  }

  risks.sort(
    (a, b) =>
      RISK_PRIORITY[b.kind] - RISK_PRIORITY[a.kind] ||
      LEVEL_PRIORITY[b.level] - LEVEL_PRIORITY[a.level]
  );

  return { risks, blocked: hasBlockingRisk(risks) };
}
