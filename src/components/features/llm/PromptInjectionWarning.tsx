import { ShieldXIcon } from "lucide-react";
import { INJECTION_RISK_MESSAGE } from "@/lib/llm/injection";

export function PromptInjectionWarning({ message }: { message?: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md border border-risk-injection/60 bg-risk-injection/15 px-3 py-2 text-sm text-risk-injection"
    >
      <ShieldXIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-medium">Posible prompt injection</p>
        <p className="text-xs text-risk-injection/90">
          {message ?? INJECTION_RISK_MESSAGE}
        </p>
      </div>
    </div>
  );
}
