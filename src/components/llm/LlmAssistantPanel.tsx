"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import { useLlm } from "@/hooks/llm/useLlm";
import { useSessionStore } from "@/stores/session.store";
import { hasTicketPermission } from "@/lib/permissions";
import { detectPromptInjection } from "@/lib/llm/injection";
import { isInsufficientContext } from "@/lib/llm/context";
import { detectPii } from "@/lib/pii/detect";
import { evaluateLlmRisks } from "@/lib/llm/risks";
import type { LlmRiskEvaluation } from "@/types/llm.types";
import { PRIORITY_LABELS } from "@/components/features/tickets/TicketBadges";
import { ConfidenceBadge } from "@/components/features/llm/ConfidenceBadge";
import { RiskBanner } from "@/components/features/llm/RiskBanner";
import { PromptInjectionWarning } from "@/components/features/llm/PromptInjectionWarning";
import { InsufficientContextNotice } from "@/components/features/llm/InsufficientContextNotice";
import { RelatedArticles } from "@/components/features/knowledge/RelatedArticles";
import type { KbArticleSummary } from "@/types/knowledge.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  LlmClassifyOutput,
  LlmChatOutput,
  LlmFeedbackAction,
  LlmSummarizeOutput,
} from "@/types/llm.types";

const DISCLAIMER = "Salida generada por IA. Verificar antes de usar.";

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

const APPLY_BLOCKED_TITLE = "Aplicación bloqueada por riesgo de prompt injection. Revisá manualmente.";

function RiskList({ evaluation }: { evaluation: LlmRiskEvaluation | null }) {
  if (!evaluation || evaluation.risks.length === 0) return null;
  return (
    <div className="space-y-2">
      {evaluation.blocked ? <PromptInjectionWarning /> : null}
      {evaluation.risks
        .filter((risk) => !(risk.kind === "prompt_injection" && risk.level === "high"))
        .map((risk, index) => (
          <RiskBanner key={`${risk.kind}-${index}`} risk={risk} />
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
  evaluation,
  feedbackSent,
  feedbackDisabled,
  onFeedback,
  onRegenerate,
}: {
  result: LlmClassifyOutput;
  evaluation: LlmRiskEvaluation | null;
  feedbackSent: LlmFeedbackAction | null;
  feedbackDisabled: boolean;
  onFeedback: (action: LlmFeedbackAction) => void;
  onRegenerate?: () => void;
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
      <RiskList evaluation={evaluation} />
      <FeedbackRow
        sent={feedbackSent}
        onFeedback={onFeedback}
        disabled={feedbackDisabled}
        onRegenerate={onRegenerate}
      />
    </div>
  );
}

function SummarizeResult({
  result,
  evaluation,
  feedbackSent,
  feedbackDisabled,
  onFeedback,
  onRegenerate,
}: {
  result: LlmSummarizeOutput;
  evaluation: LlmRiskEvaluation | null;
  feedbackSent: LlmFeedbackAction | null;
  feedbackDisabled: boolean;
  onFeedback: (action: LlmFeedbackAction) => void;
  onRegenerate?: () => void;
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
      <RiskList evaluation={evaluation} />
      <FeedbackRow
        sent={feedbackSent}
        onFeedback={onFeedback}
        disabled={feedbackDisabled}
        onRegenerate={onRegenerate}
      />
    </div>
  );
}

export function LlmAssistantPanel({
  ticketId,
  contextText,
  onUseReply,
  ticketCategory,
  onInsertReference,
}: {
  ticketId: number;
  contextText?: string;
  onUseReply?: (text: string) => void;
  ticketCategory?: string | null;
  onInsertReference?: (text: string) => void;
}) {
  const user = useSessionStore((s) => s.user);
  const {
    classify,
    summarize,
    feedback,
    piiRedact,
    chat,
  } = useLlm();
  const canUseLlm = hasTicketPermission(user?.role ?? null, "ai:suggest");

  const injectionRisk = useMemo(() => detectPromptInjection(contextText ?? ""), [contextText]);
  const insufficientContext = useMemo(
    () => isInsufficientContext(contextText ?? ""),
    [contextText]
  );

  const [classifyOut, setClassifyOut] = useState<LlmClassifyOutput | null>(null);
  const [summarizeOut, setSummarizeOut] = useState<LlmSummarizeOutput | null>(null);
  const [chatOut, setChatOut] = useState<LlmChatOutput | null>(null);
  const [chatDraft, setChatDraft] = useState("");
  const [feedbackSent, setFeedbackSent] = useState<Record<number, LlmFeedbackAction>>({});

  const classifyRisks = useMemo<LlmRiskEvaluation | null>(() => {
    if (!classifyOut) return null;
    return evaluateLlmRisks({
      confidence: classifyOut.confidence,
      warnings: classifyOut.warnings,
      injectionRisk,
    });
  }, [classifyOut, injectionRisk]);

  const summarizeRisks = useMemo<LlmRiskEvaluation | null>(() => {
    if (!summarizeOut) return null;
    return evaluateLlmRisks({
      confidence: summarizeOut.confidence,
      warnings: summarizeOut.warnings,
      injectionRisk,
    });
  }, [summarizeOut, injectionRisk]);

  const chatRisks = useMemo<LlmRiskEvaluation | null>(() => {
    if (!chatOut) return null;
    return evaluateLlmRisks({
      confidence: chatOut.confidence,
      warnings: chatOut.warnings,
      policyFlags: chatOut.policy_flags,
      piiDetections: detectPii(chatDraft),
      injectionRisk,
    });
  }, [chatOut, chatDraft, injectionRisk]);

  const handleClassify = () => classify.mutate({ ticketId }, { onSuccess: setClassifyOut });

  const handleSummarize = () => summarize.mutate({ ticketId }, { onSuccess: setSummarizeOut });

  const handleStartAll = () => {
    handleClassify();
    handleSummarize();
    handleChat();
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
    if (!chatOut || !chatDraft.trim() || chatRisks?.blocked) return;
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

  const insertReference = (article: KbArticleSummary) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const link = `${origin}/app/knowledge/articles/${article.id}`;
    onInsertReference?.(`Referencia (base de conocimiento): ${article.title} — ${link}`);
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

          <Button
            type="button"
            onClick={handleStartAll}
            disabled={classify.isPending || summarize.isPending || chat.isPending}
            className="mb-3 w-full"
          >
            {(classify.isPending || summarize.isPending || chat.isPending) ? (
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
            ) : (
              <SparklesIcon aria-hidden />
            )}
            {(classify.isPending || summarize.isPending || chat.isPending)
              ? "Procesando…"
              : "Iniciar asistente"}
          </Button>

          <Tabs defaultValue="classify">
            <TabsList className="w-full">
              <TabsTrigger value="classify">Clasificar</TabsTrigger>
              <TabsTrigger value="summarize">Resumir</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
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
                  evaluation={classifyRisks}
                  feedbackSent={feedbackSent[classifyOut.suggestion_id] ?? null}
                  feedbackDisabled={feedback.isPending}
                  onFeedback={(action) => void sendFeedback(classifyOut.suggestion_id, action)}
                  onRegenerate={handleClassify}
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
                  evaluation={summarizeRisks}
                  feedbackSent={feedbackSent[summarizeOut.suggestion_id] ?? null}
                  feedbackDisabled={feedback.isPending}
                  onFeedback={(action) => void sendFeedback(summarizeOut.suggestion_id, action)}
                  onRegenerate={handleSummarize}
                />
              ) : null}
            </TabsContent>

            <TabsContent value="chat" className="mt-3 space-y-3">
              {insufficientContext ? <InsufficientContextNotice /> : null}
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
                  <RiskList evaluation={chatRisks} />
                  <div className="flex flex-wrap items-center gap-1.5">
                    <ConfidenceBadge confidence={chatOut.confidence} />
                    {chatOut.sources.length > 0 ? (
                      <span className="text-xs text-muted-foreground">
                        {chatOut.sources.length} fuente
                        {chatOut.sources.length === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void applyChatInComposer()}
                      disabled={!chatDraft.trim() || (chatRisks?.blocked ?? false)}
                      title={chatRisks?.blocked ? APPLY_BLOCKED_TITLE : undefined}
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
                    onRegenerate={handleChat}
                  />
                </div>
              ) : null}
            </TabsContent>
          </Tabs>

          <section className="mt-4 space-y-2" aria-label="Artículos relacionados">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Artículos relacionados
            </h3>
            <RelatedArticles
              category={ticketCategory}
              onInsertReference={insertReference}
            />
          </section>
        </div>
      </div>
    </aside>
  );
}
