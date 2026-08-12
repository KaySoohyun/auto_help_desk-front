import { cn } from "@/lib/utils";
import { confidenceLevel, CONFIDENCE_LABELS, type ConfidenceLevel } from "@/lib/llm/confidence";

const CONFIDENCE_CLASSES: Record<ConfidenceLevel, string> = {
  high: "text-sla-ok border-sla-ok/40",
  medium: "text-risk-low-confidence border-risk-low-confidence/40",
  low: "text-priority-urgent border-priority-urgent/40",
};

export function ConfidenceBadge({
  confidence,
  className,
}: {
  confidence: number;
  className?: string;
}) {
  const level = confidenceLevel(confidence);
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-[min(var(--radius-sm),8px)] border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        CONFIDENCE_CLASSES[level],
        className
      )}
    >
      Confianza {Math.round(confidence * 100)}% · {CONFIDENCE_LABELS[level]}
    </span>
  );
}
