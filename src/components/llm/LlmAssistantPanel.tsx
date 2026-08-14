"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  AlertTriangleIcon,
  CheckIcon,
  FlagIcon,
  Loader2Icon,
  PenLineIcon,
  RefreshCwIcon,
  ShieldAlertIcon,
  SparklesIcon,
  XIcon,
  BookOpenIcon,
} from "lucide-react";
import { useTicketAnalyze } from "@/hooks/tickets/useTicketAnalyze";
import { useLlm } from "@/hooks/llm/useLlm";
import { useSessionStore } from "@/stores/session.store";
import { hasTicketPermission } from "@/lib/permissions";
import type { LlmAnalyzeOutput, LlmFeedbackAction } from "@/types/llm.types";
import { PRIORITY_LABELS } from "@/components/features/tickets/TicketBadges";
import { ConfidenceBadge } from "@/components/features/llm/ConfidenceBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const DISCLAIMER = "Las sugerencias del LLM son orientativas y deben ser revisadas por un agente antes de enviarse.";

const FEEDBACK_LABELS: Record<LlmFeedbackAction, string> = {
  accepted: "Aceptada",
  edited: "Editada",
  rejected: "Rechazada",
  flagged: "Marcada",
};

const ACTION_LABELS: Record<LlmFeedbackAction, string> = {
  accepted: "Aceptar",
  edited: "Editar",
  rejected: "Rechazar",
  flagged: "Marcar",
};

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md border border-destructive/60 bg-destructive/40 px-3 py-2 text-sm text-destructive-foreground"
    >
      <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <p>{message}</p>
        {onRetry ? (
          <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
            Reintentar
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function FeedbackRow({
  sent,
  onFeedback,
  disabled,
}: {
  sent: LlmFeedbackAction | null;
  onFeedback: (action: LlmFeedbackAction) => void;
  disabled: boolean;
}) {
  if (sent) {
    return (
      <p className="text-xs text-muted-foreground">
        Feedback registrado: {FEEDBACK_LABELS[sent]}.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => onFeedback("accepted")}
      >
        <CheckIcon aria-hidden />
        {ACTION_LABELS.accepted}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => onFeedback("edited")}
      >
        <PenLineIcon aria-hidden />
        {ACTION_LABELS.edited}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => onFeedback("rejected")}
      >
        <XIcon aria-hidden />
        {ACTION_LABELS.rejected}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => onFeedback("flagged")}
      >
        <FlagIcon aria-hidden />
        {ACTION_LABELS.flagged}
      </Button>
    </div>
  );
}

export function LlmAssistantPanel({
  ticketId,
  onUseReply,
}: {
  ticketId: number;
  onUseReply?: (text: string) => void;
}) {
  const user = useSessionStore((s) => s.user);
  const analyze = useTicketAnalyze(ticketId);
  const { feedback, piiRedact } = useLlm();
  const canUseLlm = hasTicketPermission(user?.role ?? null, "ai:suggest");

  const [analyzeResult, setAnalyzeResult] = useState<LlmAnalyzeOutput | null>(null);
  const [chatDraft, setChatDraft] = useState("");
  const [feedbackSent, setFeedbackSent] = useState<Record<number, LlmFeedbackAction>>({});
  const [autoAnalyzed, setAutoAnalyzed] = useState(false);

  // Auto-analizar al cargar el ticket
  useEffect(() => {
    if (canUseLlm && !autoAnalyzed && !analyzeResult && !analyze.isPending) {
      analyze.mutate(undefined, {
        onSuccess: (data) => {
          setAnalyzeResult(data);
          if (data.suggested_reply && !("error" in data.suggested_reply)) {
            setChatDraft(data.suggested_reply.suggested_reply);
          }
          setAutoAnalyzed(true);
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseLlm, autoAnalyzed, analyzeResult]);

  const handleRegenerateAll = () => {
    setAutoAnalyzed(false);
    setAnalyzeResult(null);
    analyze.mutate(undefined, {
      onSuccess: (data) => {
        setAnalyzeResult(data);
        if (data.suggested_reply && !("error" in data.suggested_reply)) {
          setChatDraft(data.suggested_reply.suggested_reply);
        }
        setAutoAnalyzed(true);
      },
    });
  };

  const sendFeedback = async (suggestionId: number, action: LlmFeedbackAction) => {
    try {
      await feedback.mutateAsync({ ticketId, suggestion_id: suggestionId, action });
      setFeedbackSent((prev) => ({ ...prev, [suggestionId]: action }));
      toast.success(`Feedback registrado: ${FEEDBACK_LABELS[action]}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo registrar el feedback.");
    }
  };

  const applyChatInComposer = async () => {
    if (!suggestedReply) return;
    if (!chatDraft.trim()) return;
    
    const changed = chatDraft !== suggestedReply.suggested_reply;
    onUseReply?.(chatDraft);
    
    if (!feedbackSent[suggestedReply.suggestion_id]) {
      await sendFeedback(suggestedReply.suggestion_id, changed ? "edited" : "accepted");
    }
  };

  const redactChat = async () => {
    if (!chatDraft.trim()) return;
    try {
      const result = await piiRedact.mutateAsync({ text: chatDraft, mode: "redact" });
      setChatDraft(result.text);
      toast.success("PII redactada en el borrador.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo redactar la PII.");
    }
  };

  if (!canUseLlm) {
    return (
      <aside aria-label="Asistente LLM" className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <ShieldAlertIcon className="mx-auto mb-2 size-6 text-risk-pii" aria-hidden />
          <p className="text-sm font-medium">Asistente LLM no disponible</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tu rol no tiene permiso para usar el asistente con IA.
          </p>
        </div>
      </aside>
    );
  }

  const isLoading = analyze.isPending;
  const hasError = analyze.isError;
  
  // Type guards para narrowing
  const classification = analyzeResult?.classification && !("error" in analyzeResult.classification) 
    ? analyzeResult.classification 
    : null;
  const summary = analyzeResult?.summary && !("error" in analyzeResult.summary) 
    ? analyzeResult.summary 
    : null;
  const suggestedReply = analyzeResult?.suggested_reply && !("error" in analyzeResult.suggested_reply) 
    ? analyzeResult.suggested_reply 
    : null;

  return (
    <aside aria-label="Asistente LLM" className="space-y-4">
      <div className="rounded-lg border border-content-llm-border/40 bg-card">
        {/* Header con botón Regenerar */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <SparklesIcon className="size-4 text-llm" aria-hidden />
            <h2 className="text-sm font-semibold">Asistente LLM</h2>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRegenerateAll}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCwIcon aria-hidden />
            )}
            {isLoading ? "Analizando..." : "Regenerar"}
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Disclaimer */}
          <p className="rounded-md bg-content-llm-bg px-3 py-2 text-xs text-muted-foreground">
            {DISCLAIMER}
          </p>

          {/* Error state */}
          {hasError && (
            <ErrorState
              message={analyze.error?.message ?? "No se pudo analizar el ticket."}
              onRetry={handleRegenerateAll}
            />
          )}

          {/* Loading state */}
          {isLoading && !analyzeResult && (
            <div className="space-y-3">
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-20 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            </div>
          )}

          {/* Clasificación */}
          {classification && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Clasificación sugerida
              </h3>
              <div className="space-y-2 rounded-md border border-border bg-background/40 p-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge>{classification.category}</Badge>
                  {classification.suggested_priority && (
                    <Badge variant="outline">
                      {PRIORITY_LABELS[classification.suggested_priority]}
                    </Badge>
                  )}
                  <ConfidenceBadge confidence={classification.confidence} />
                </div>
                {classification.subcategory && (
                  <p className="text-xs text-muted-foreground">
                    Subcategoría: {classification.subcategory}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Intención: {classification.intent}
                </p>
                {classification.rationale && (
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
                    {classification.rationale}
                  </p>
                )}
                {classification.suggestion_id && (
                  <FeedbackRow
                    sent={feedbackSent[classification.suggestion_id] ?? null}
                    onFeedback={(action) => void sendFeedback(classification.suggestion_id, action)}
                    disabled={feedback.isPending}
                  />
                )}
              </div>
            </div>
          )}

          {/* Resumen */}
          {summary && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Resumen
              </h3>
              <div className="space-y-2 rounded-md border border-border bg-background/40 p-3">
                <ConfidenceBadge confidence={summary.confidence} />
                <p className="text-sm whitespace-pre-wrap break-words">{summary.summary}</p>
                {summary.missing_information && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Falta información: </span>
                    {summary.missing_information}
                  </p>
                )}
                {summary.suggestion_id && (
                  <FeedbackRow
                    sent={feedbackSent[summary.suggestion_id] ?? null}
                    onFeedback={(action) => void sendFeedback(summary.suggestion_id, action)}
                    disabled={feedback.isPending}
                  />
                )}
              </div>
            </div>
          )}

          {/* PII detectada */}
          {analyzeResult?.pii_detected && analyzeResult.pii_detected.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                PII detectada
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {analyzeResult.pii_detected.map((pii, index) => (
                  <Badge key={index} variant="destructive">
                    {pii.type}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Riesgos */}
          {analyzeResult?.risks && analyzeResult.risks.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Riesgos
              </h3>
              <div className="space-y-1.5">
                {analyzeResult.risks.map((risk, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 dark:text-rose-300 dark:bg-rose-950/20 dark:border-rose-900"
                  >
                    <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    <span>{risk}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Artículos recomendados */}
          {analyzeResult?.kb_recommendations && analyzeResult.kb_recommendations.length > 0 && (
            <div className="space-y-2">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <BookOpenIcon className="size-3.5" aria-hidden />
                Artículos recomendados
              </h3>
              <ul className="space-y-1">
                {analyzeResult.kb_recommendations.map((rec) => (
                  <li key={rec.article_id} className="flex items-center gap-2 text-sm">
                    <span className="size-1 rounded-full bg-muted-foreground" />
                    <span>{rec.title}</span>
                    <ConfidenceBadge confidence={rec.score} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Respuesta sugerida */}
          {suggestedReply && (
            <div className="space-y-2 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Respuesta sugerida
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerateAll}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2Icon className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <RefreshCwIcon aria-hidden />
                  )}
                  Regenerar
                </Button>
              </div>
              <div className="space-y-3">
                <Textarea
                  rows={6}
                  value={chatDraft}
                  onChange={(event) => setChatDraft(event.target.value)}
                  aria-label="Respuesta de la IA"
                  disabled={isLoading}
                />
                <div className="flex flex-wrap items-center gap-1.5">
                  <ConfidenceBadge confidence={suggestedReply.confidence} />
                  {suggestedReply.sources.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {suggestedReply.sources.length} fuente
                      {suggestedReply.sources.length === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void applyChatInComposer()}
                    disabled={!chatDraft.trim()}
                  >
                    <PenLineIcon aria-hidden />
                    Usar en respuesta
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void redactChat()}
                    disabled={piiRedact.isPending || !chatDraft.trim()}
                  >
                    {piiRedact.isPending ? (
                      <Loader2Icon className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <ShieldAlertIcon aria-hidden />
                    )}
                    Redactar PII
                  </Button>
                </div>
                <FeedbackRow
                  sent={feedbackSent[suggestedReply.suggestion_id] ?? null}
                  onFeedback={(action) => void sendFeedback(suggestedReply.suggestion_id, action)}
                  disabled={feedback.isPending}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
