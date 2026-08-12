import { FileQuestionIcon } from "lucide-react";

export const INSUFFICIENT_CONTEXT_MESSAGE =
  "No hay suficiente contexto para una sugerencia confiable. Revisá manualmente.";

export function InsufficientContextNotice({ message }: { message?: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-risk-low-confidence/40 bg-risk-low-confidence/10 px-3 py-2 text-sm text-risk-low-confidence">
      <FileQuestionIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p className="min-w-0 flex-1 text-xs font-medium">{message ?? INSUFFICIENT_CONTEXT_MESSAGE}</p>
    </div>
  );
}
