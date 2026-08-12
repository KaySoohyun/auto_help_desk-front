"use client";

import { useState, useRef } from "react";
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
  SquareIcon,
  XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLlm } from "@/hooks/llm/useLlm";
import type { StreamHandlers } from "@/hooks/llm/useLlm";
import { useSessionStore } from "@/stores/session.store";
import { hasTicketPermission } from "@/lib/permissions";
import { detectPii, PII_LABELS, type PiiDetection } from "@/lib/pii/detect";
import { PRIORITY_LABELS } from "@/components/features/tickets/TicketBadges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  LlmClassifyOutput,
  LlmChatOutput,
  LlmStreamToken,
  LlmSuggestReplyOutput,
  LlmFeedbackAction,
  LlmSummarizeOutput,
} from "@/types/llm.types";

const DISCLAIMER = "Salida generada por IA. Verificar antes de usar.";

const SUGGEST_TONES = [
  { tone: "formal", label: "Formal" },
  { tone: "empático", label: "Empático" },
  { tone: "conciso", label: "Conciso" },
] as const;

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

type ConfidenceLevel = "high" | "medium" | "low";

function confidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.8) return "high";
  if (confidence >= 0.6) return "medium";
  return "low";
}

const CONFIDENCE_CLASSES: Record<ConfidenceLevel, string> = {
  high: "text-sla-ok border-sla-ok/40",
  medium: "text-risk-low-confidence border-risk-low-confidence/40",
  low: "text-priority-urgent border-priority-urgent/40",
};

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const level = confidenceLevel(confidence);
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-[min(var(--radius-sm),8px)] border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        CONFIDENCE_CLASSES[level]
      )}
    >
      Confianza {Math.round(confidence * 100)}%
    </span>
  );
}

function WarningList({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;
  return (
    <ul className="space-y-1">
      {warnings.map((warning) => (
        <li
          key={warning}
          className="flex items-start gap-1.5 text-xs text-risk-low-confidence"
        >
          <AlertTriangleIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>{warning}</span>
        </li>
      ))}
    </ul>
  );
}

function PiiDetectionList({ detections }: { detections: PiiDetection[] }) {
  if (detections.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5" role="status">
      {detections.map((detection) => (
        <span
          key={detection.type}
          className="inline-flex w-fit items-center gap-1 rounded-[min(var(--radius-sm),8px)] border border-risk-pii/40 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-risk-pii"
        >
          <ShieldAlertIcon aria-hidden />
          {PII_LABELS[detection.type]}: {detection.count}
        </span>
      ))}
    </div>
  );
}

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
  onRegenerate,
  disabled,
}: {
  sent: LlmFeedbackAction | null;
  onFeedback: (action: LlmFeedbackAction) => void;
  onRegenerate?: () => void;
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
      {onRegenerate ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onRegenerate()}
        >
          <RefreshCwIcon aria-hidden />
          Regenerar
        </Button>
      ) : null}
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

function ClassifyResult({
  result,
  feedbackSent,
  feedbackDisabled,
  onFeedback,
}: {
  result: LlmClassifyOutput;
  feedbackSent: LlmFeedbackAction | null;
  feedbackDisabled: boolean;
  onFeedback: (action: LlmFeedbackAction) => void;
}) {
  return (
    <div className="space-y-3 rounded-md border border-border bg-background/40 p-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge>{result.category}</Badge>
        {result.suggested_priority ? (
          <Badge variant="outline">{PRIORITY_LABELS[result.suggested_priority]}</Badge>
        ) : null}
        <ConfidenceBadge confidence={result.confidence} />
      </div>
      <dl className="space-y-1 text-sm">
        {result.subcategory ? (
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Subcategoría</dt>
            <dd>{result.subcategory}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Intención</dt>
          <dd>{result.intent}</dd>
        </div>
      </dl>
      {result.rationale ? (
        <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
          {result.rationale}
        </p>
      ) : null}
      <WarningList warnings={result.warnings} />
      <FeedbackRow
        sent={feedbackSent}
        onFeedback={onFeedback}
        disabled={feedbackDisabled}
      />
    </div>
  );
}

function SummarizeResult({
  result,
  feedbackSent,
  feedbackDisabled,
  onFeedback,
}: {
  result: LlmSummarizeOutput;
  feedbackSent: LlmFeedbackAction | null;
  feedbackDisabled: boolean;
  onFeedback: (action: LlmFeedbackAction) => void;
}) {
  return (
    <div className="space-y-3 rounded-md border border-border bg-background/40 p-3">
      <ConfidenceBadge confidence={result.confidence} />
      <p className="text-sm whitespace-pre-wrap break-words">{result.summary}</p>
      {result.missing_information ? (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Falta información: </span>
          {result.missing_information}
        </p>
      ) : null}
      <WarningList warnings={result.warnings} />
      <FeedbackRow
        sent={feedbackSent}
        onFeedback={onFeedback}
        disabled={feedbackDisabled}
      />
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
  const {
    classify,
    summarize,
    suggestReply,
    feedback,
    piiRedact,
    chat,
    startStream,
    isStreaming,
    streamError,
  } = useLlm();
  const canUseLlm = hasTicketPermission(user?.role ?? null, "ai:suggest");

  const [classifyOut, setClassifyOut] = useState<LlmClassifyOutput | null>(null);
  const [summarizeOut, setSummarizeOut] = useState<LlmSummarizeOutput | null>(null);
  const [chatOut, setChatOut] = useState<LlmChatOutput | null>(null);
  const [chatDraft, setChatDraft] = useState("");
  const [suggestions, setSuggestions] = useState<LlmSuggestReplyOutput[] | null>(null);
  const [suggestDrafts, setSuggestDrafts] = useState<Record<number, string>>({});
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [streamTokens, setStreamTokens] = useState<LlmStreamToken[]>([]);
  const [streamOutput, setStreamOutput] = useState("");
  const [streamConfidence, setStreamConfidence] = useState<number | null>(null);
  const [feedbackSent, setFeedbackSent] = useState<Record<number, LlmFeedbackAction>>({});
  const streamAbortRef = useRef<(() => void) | null>(null);

  const handleClassify = () => classify.mutate({ ticketId }, { onSuccess: setClassifyOut });

  const handleSummarize = () => summarize.mutate({ ticketId }, { onSuccess: setSummarizeOut });

  const sendFeedback = async (suggestionId: number, action: LlmFeedbackAction) => {
    try {
      await feedback.mutateAsync({ ticketId, suggestion_id: suggestionId, action });
      setFeedbackSent((prev) => ({ ...prev, [suggestionId]: action }));
      toast.success(`Feedback registrado: ${FEEDBACK_LABELS[action]}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo registrar el feedback.");
    }
  };

  const handleChat = () =>
    chat.mutate(
      { ticketId },
      {
        onSuccess: (data) => {
          setChatOut(data);
          setChatDraft(data.suggested_reply);
        },
      }
    );

  const applyChatInComposer = async () => {
    if (!chatOut || !chatDraft.trim()) return;
    const changed = chatDraft !== chatOut.suggested_reply;
    onUseReply?.(chatDraft);
    if (!feedbackSent[chatOut.suggestion_id]) {
      await sendFeedback(chatOut.suggestion_id, changed ? "edited" : "accepted");
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

  const handleSuggest = async () => {
    setSuggestionsLoading(true);
    setSuggestionsError(null);
    try {
      const results = await Promise.all(
        SUGGEST_TONES.map(({ tone }) => suggestReply.mutateAsync({ ticketId, tone }))
      );
      setSuggestions(results);
      setSuggestDrafts(
        results.reduce<Record<number, string>>((acc, result, index) => {
          acc[index] = result.suggested_reply;
          return acc;
        }, {})
      );
    } catch (err) {
      setSuggestionsError(
        err instanceof Error ? err.message : "No se pudieron generar las sugerencias."
      );
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleUseSuggestion = async (suggestion: LlmSuggestReplyOutput, draft: string) => {
    onUseReply?.(draft);
    if (!feedbackSent[suggestion.suggestion_id]) {
      await sendFeedback(
        suggestion.suggestion_id,
        draft === suggestion.suggested_reply ? "accepted" : "edited"
      );
    }
  };

  const handleStream = () => {
    if (isStreaming) {
      streamAbortRef.current?.();
      return;
    }
    setStreamTokens([]);
    setStreamOutput("");
    setStreamConfidence(null);

    const handlers: StreamHandlers = {
      onToken: (token) => {
        setStreamTokens((prev) => [...prev, token]);
        setStreamOutput((prev) => prev + token.token);
        if (token.confidence > 0) setStreamConfidence(token.confidence);
      },
      onError: (err) => {
        toast.error(err.message);
      },
      onDone: () => {
        toast.success("Stream completado.");
      },
    };

    streamAbortRef.current = startStream({ ticketId }, handlers);
  };

  if (!canUseLlm) {
    return (
      <aside aria-label="Asistente LLM" className="lg:w-[360px] lg:shrink-0">
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

  return (
    <aside aria-label="Asistente LLM" className="lg:w-[360px] lg:shrink-0">
      <div className="rounded-lg border border-content-llm-border/40 bg-card">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <SparklesIcon className="size-4 text-llm" aria-hidden />
          <h2 className="text-sm font-semibold">Asistente LLM</h2>
        </div>
        <div className="p-4">
          <p className="mb-3 rounded-md bg-content-llm-bg px-3 py-2 text-xs text-muted-foreground">
            {DISCLAIMER}
          </p>

          <Tabs defaultValue="classify">
            <TabsList className="w-full">
              <TabsTrigger value="classify">Clasificar</TabsTrigger>
              <TabsTrigger value="summarize">Resumir</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="suggestions">Sugerencias</TabsTrigger>
              <TabsTrigger value="streaming">Streaming</TabsTrigger>
            </TabsList>

            <TabsContent value="classify" className="mt-3 space-y-3">
              <p className="text-xs text-muted-foreground">
                Clasifica el ticket con categoría, intención y prioridad sugerida.
              </p>
              <Button
                type="button"
                onClick={handleClassify}
                disabled={classify.isPending}
              >
                {classify.isPending ? (
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                ) : (
                  <SparklesIcon aria-hidden />
                )}
                {classify.isPending ? "Clasificando…" : "Clasificar ticket"}
              </Button>
              {classify.isError ? (
                <ErrorState
                  message={classify.error?.message ?? "No se pudo clasificar el ticket."}
                  onRetry={handleClassify}
                />
              ) : null}
              {classifyOut ? (
                <ClassifyResult
                  result={classifyOut}
                  feedbackSent={feedbackSent[classifyOut.suggestion_id] ?? null}
                  feedbackDisabled={feedback.isPending}
                  onFeedback={(action) => void sendFeedback(classifyOut.suggestion_id, action)}
                />
              ) : null}
            </TabsContent>

            <TabsContent value="summarize" className="mt-3 space-y-3">
              <p className="text-xs text-muted-foreground">
                Genera un resumen del hilo y qué información falta.
              </p>
              <Button
                type="button"
                onClick={handleSummarize}
                disabled={summarize.isPending}
              >
                {summarize.isPending ? (
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                ) : (
                  <SparklesIcon aria-hidden />
                )}
                {summarize.isPending ? "Resumiendo…" : "Resumir ticket"}
              </Button>
              {summarize.isError ? (
                <ErrorState
                  message={summarize.error?.message ?? "No se pudo resumir el ticket."}
                  onRetry={handleSummarize}
                />
              ) : null}
              {summarizeOut ? (
                <SummarizeResult
                  result={summarizeOut}
                  feedbackSent={feedbackSent[summarizeOut.suggestion_id] ?? null}
                  feedbackDisabled={feedback.isPending}
                  onFeedback={(action) => void sendFeedback(summarizeOut.suggestion_id, action)}
                />
              ) : null}
            </TabsContent>

            <TabsContent value="chat" className="mt-3 space-y-3">
              <p className="text-xs text-muted-foreground">
                Genera una respuesta editable basada en el contexto del ticket.
              </p>
              <Button
                type="button"
                onClick={handleChat}
                disabled={chat.isPending}
              >
                {chat.isPending ? (
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                ) : (
                  <SparklesIcon aria-hidden />
                )}
                {chat.isPending ? "Generando…" : "Generar respuesta"}
              </Button>
              {chat.isError ? (
                <ErrorState
                  message={chat.error?.message ?? "No se pudo conectar con el asistente."}
                  onRetry={handleChat}
                />
              ) : null}
              {chatOut ? (
                <div className="space-y-3">
                  <Textarea
                    rows={6}
                    value={chatDraft}
                    onChange={(event) => setChatDraft(event.target.value)}
                    aria-label="Respuesta de la IA"
                    disabled={chat.isPending}
                  />
                  <PiiDetectionList detections={detectPii(chatDraft)} />
                  <div className="flex flex-wrap items-center gap-1.5">
                    <ConfidenceBadge confidence={chatOut.confidence} />
                    {chatOut.sources.length > 0 ? (
                      <span className="text-xs text-muted-foreground">
                        {chatOut.sources.length} fuente
                        {chatOut.sources.length === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </div>
              <WarningList warnings={chatOut.warnings} />
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
                sent={feedbackSent[chatOut.suggestion_id] ?? null}
                onFeedback={(action) => void sendFeedback(chatOut.suggestion_id, action)}
                disabled={feedback.isPending}
              />
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="suggestions" className="mt-3 space-y-3">
              <p className="text-xs text-muted-foreground">
                Genera 3 respuestas con distintos tonos para elegir.
              </p>
              <Button
                type="button"
                onClick={() => void handleSuggest()}
                disabled={suggestionsLoading}
              >
                {suggestionsLoading ? (
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                ) : (
                  <SparklesIcon aria-hidden />
                )}
                {suggestionsLoading ? "Generando…" : "Generar sugerencias"}
              </Button>
              {suggestionsError ? (
                <ErrorState message={suggestionsError} onRetry={() => void handleSuggest()} />
              ) : null}
              {suggestions
                ? suggestions.map((suggestion, idx) => {
                    const tone = SUGGEST_TONES[idx];
                    const draftValue = suggestDrafts[idx] ?? suggestion.suggested_reply;
                    return (
                      <div
                        key={idx}
                        className="space-y-3 rounded-md border border-border bg-background/40 p-3"
                      >
                        <p className="text-xs font-medium text-muted-foreground">
                          Tono {tone.label}
                        </p>
                        <Textarea
                          rows={3}
                          value={draftValue}
                          onChange={(event) =>
                            setSuggestDrafts((prev) => ({ ...prev, [idx]: event.target.value }))
                          }
                          aria-label={`Sugerencia ${idx + 1} (tono ${tone.label})`}
                        />
                        <div className="flex flex-wrap items-center gap-1.5">
                          <ConfidenceBadge confidence={suggestion.confidence} />
                        </div>
                        <WarningList warnings={suggestion.warnings} />
                        <div className="flex flex-wrap gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void handleUseSuggestion(suggestion, draftValue)}
                            disabled={!draftValue.trim()}
                          >
                            <PenLineIcon aria-hidden />
                            Usar sugerencia
                          </Button>
                        </div>
                        <FeedbackRow
                          sent={feedbackSent[suggestion.suggestion_id] ?? null}
                          onFeedback={(action) => void sendFeedback(suggestion.suggestion_id, action)}
                          disabled={feedback.isPending}
                          onRegenerate={() => void handleSuggest()}
                        />
                      </div>
                    );
                  })
                : null}
            </TabsContent>

            <TabsContent value="streaming" className="mt-3 space-y-3">
              <p className="text-xs text-muted-foreground">
                Genera la respuesta y la muestra en tiempo real vía Server-Sent Events.
              </p>
              {isStreaming ? (
                <Button type="button" variant="outline" size="sm" onClick={handleStream}>
                  <SquareIcon className="size-4" aria-hidden />
                  Cancelar stream
                </Button>
              ) : (
                <Button type="button" onClick={handleStream}>
                  {streamError ? (
                    <RefreshCwIcon className="size-4" aria-hidden />
                  ) : (
                    <SparklesIcon aria-hidden />
                  )}
                  {streamError ? "Reintentar" : "Iniciar stream"}
                </Button>
              )}
              {streamError ? (
                <ErrorState
                  message={streamError.message}
                  onRetry={handleStream}
                />
              ) : null}
              {streamOutput ? (
                <div className="space-y-2">
                  <Textarea
                    rows={8}
                    value={streamOutput}
                    aria-label="Salida del stream en tiempo real"
                    readOnly
                    className="font-mono text-sm"
                  />
                  <div className="flex flex-wrap items-center gap-1.5">
                    {streamConfidence !== null ? (
                      <ConfidenceBadge confidence={streamConfidence} />
                    ) : null}
                    <span className="text-xs text-muted-foreground">
                      {streamTokens.length} eventos recibidos
                    </span>
                  </div>
                </div>
              ) : null}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </aside>
  );
}
