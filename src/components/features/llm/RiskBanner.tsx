import {
  AlertTriangleIcon,
  FileQuestionIcon,
  LandmarkIcon,
  ShieldAlertIcon,
  ShieldXIcon,
  TrendingDownIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LlmRisk, LlmRiskKind, LlmRiskLevel } from "@/types/llm.types";

const RISK_ICONS: Record<LlmRiskKind, LucideIcon> = {
  low_confidence: TrendingDownIcon,
  hallucination: AlertTriangleIcon,
  pii: ShieldAlertIcon,
  prompt_injection: ShieldXIcon,
  insufficient_context: FileQuestionIcon,
  policy: LandmarkIcon,
  warning: AlertTriangleIcon,
};

const KIND_CLASSES: Record<LlmRiskKind, string> = {
  low_confidence: "text-risk-low-confidence border-risk-low-confidence/40 bg-risk-low-confidence/10",
  hallucination: "text-priority-urgent border-priority-urgent/40 bg-priority-urgent/10",
  pii: "text-risk-pii border-risk-pii/40 bg-risk-pii/10",
  prompt_injection: "text-risk-injection border-risk-injection/40 bg-risk-injection/10",
  insufficient_context: "text-risk-low-confidence border-risk-low-confidence/40 bg-risk-low-confidence/10",
  policy: "text-llm border-llm/40 bg-llm/10",
  warning: "text-risk-low-confidence border-risk-low-confidence/40 bg-risk-low-confidence/10",
};

const LEVEL_ALERT: Record<LlmRiskLevel, boolean> = {
  high: true,
  medium: false,
  low: false,
};

export function RiskBanner({ risk, className }: { risk: LlmRisk; className?: string }) {
  const Icon = RISK_ICONS[risk.kind];
  return (
    <div
      role={LEVEL_ALERT[risk.level] ? "alert" : undefined}
      className={cn(
        "flex items-start gap-2 rounded-md border px-3 py-2 text-sm",
        KIND_CLASSES[risk.kind],
        className
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p className="min-w-0 flex-1 text-xs font-medium whitespace-pre-wrap break-words">
        {risk.message}
      </p>
    </div>
  );
}
