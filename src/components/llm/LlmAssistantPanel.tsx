"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangleIcon,
  Loader2Icon,
  PenLineIcon,
  RefreshCwIcon,
  ShieldAlertIcon,
  SparklesIcon,
  CheckIcon,
  BookOpenIcon,
  MoreVerticalIcon,
  SaveIcon,
} from "lucide-react";
import { useTicketSuggestions } from "@/hooks/tickets/useTicketSuggestions";
import { useTicket } from "@/hooks/tickets/useTicket";
import { useUpdateTicket } from "@/hooks/tickets/useUpdateTicket";
import { useCategories } from "@/hooks/tickets/useCategories";
import { useLlm } from "@/hooks/llm/useLlm";
import { useArticles } from "@/hooks/knowledge/useArticles";
import { useTenantSlug } from "@/hooks/useTenantSlug";
import { useSessionStore } from "@/stores/session.store";
import { hasTicketPermission } from "@/lib/permissions";
import type {
  SuggestionRecord,
  LlmClassifyOutput,
  LlmSummarizeOutput,
  LlmSuggestReplyOutput,
  LlmFeedbackAction,
} from "@/types/llm.types";
import { PRIORITY_LABELS } from "@/components/features/tickets/TicketBadges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TicketPriority } from "@/types/ticket.types";

const DISCLAIMER = "Las sugerencias del LLM son orientativas y deben ser revisadas por un agente antes de aplicarse.";

const FEEDBACK_LABELS: Record<LlmFeedbackAction, string> = {
  accepted: "Aceptada",
  edited: "Editada",
  rejected: "Rechazada",
  flagged: "Marcada",
};

type Priority = TicketPriority | null;

type PendingSuggestion =
  | { kind: "classification"; classification: LlmClassifyOutput }
  | { kind: "summary"; summary: LlmSummarizeOutput }
  | { kind: "reply"; reply: LlmSuggestReplyOutput };

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

function SectionMenu({
  onApply,
  onEdit,
  onRegenerate,
  canApply,
  disabled,
}: {
  onApply?: () => void;
  onEdit: () => void;
  onRegenerate: () => void;
  canApply: boolean;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {canApply ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Aplicar cambios"
          aria-label="Aplicar cambios"
          onClick={onApply}
          disabled={disabled}
        >
          <SaveIcon className="size-4" aria-hidden />
        </Button>
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Opciones"
            aria-label="Opciones de la sección"
            disabled={disabled}
          >
            <MoreVerticalIcon className="size-4" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canApply ? (
            <DropdownMenuItem onSelect={onApply}>
              <SaveIcon className="size-4" aria-hidden />
              Aplicar cambios
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onSelect={onEdit}>
            <PenLineIcon className="size-4" aria-hidden />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onRegenerate}>
            <RefreshCwIcon className="size-4" aria-hidden />
            Regenerar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
  const tenantSlug = useTenantSlug();
  const canUseLlm = hasTicketPermission(user?.role ?? null, "ai:suggest");
  const updateTicket = useUpdateTicket(ticketId);
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  const ticketSuggestions = useTicketSuggestions(canUseLlm ? ticketId : null);
  const { data: ticket } = useTicket(canUseLlm ? ticketId : null);

  const { classify, summarize, suggestReply, feedback } = useLlm();

  // Estado local de las sugerencias "en sesión" (draft o re-generadas)
  const [pending, setPending] = useState<PendingSuggestion[]>([]);
  const [editing, setEditing] = useState<"classification" | "summary" | null>(null);
  const [draftCategory, setDraftCategory] = useState<string>("");
  const [draftPriority, setDraftPriority] = useState<Priority>(null);
  const [draftSummary, setDraftSummary] = useState<string>("");
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [replyDraft, setReplyDraft] = useState<string>("");
  const [autoReplyGenerated, setAutoReplyGenerated] = useState(false);

  // Cargar sugerencias persistidas al entrar; clasif/resumen se muestran desde acá.
  const persistedSuggestions = useMemo(() => {
    return (ticketSuggestions.data ?? []).slice().sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [ticketSuggestions.data]);

  const persistedClassification = useMemo(
    () => persistedSuggestions.find((s) => s.type === "classification"),
    [persistedSuggestions]
  );
  const persistedSummary = useMemo(
    () => persistedSuggestions.find((s) => s.type === "summary"),
    [persistedSuggestions]
  );
  const persistedReply = useMemo(
    () => persistedSuggestions.find((s) => s.type === "reply"),
    [persistedSuggestions]
  );

  const classificationPending = pending.find((p) => p.kind === "classification")?.classification ?? null;
  const summaryPending = pending.find((p) => p.kind === "summary")?.summary ?? null;
  const replyPending = pending.find((p) => p.kind === "reply")?.reply ?? null;

  // Artículos recomendados según la categoría efectiva (sugerida o del ticket)
  const effectiveCategory =
    ((classificationPending?.category ??
      (persistedClassification ? String(persistedClassification.output.category ?? "") : "")) ||
      ticket?.category) ??
    undefined;
  const { data: articlesData, isLoading: articlesLoading } = useArticles({
    status: "published",
    category: effectiveCategory,
    limit: 5,
    offset: 0,
  });
  const recommendedArticles = articlesData?.items ?? [];

  const isLoadingPanel =
    ticketSuggestions.isLoading || (autoReplyGenerated === false && !replyPending && !replyDraft && !persistedReply);

  // Reglas de visibilidad
  const classificationApplied = applied.has("classification");
  const classificationVisible =
    ((persistedClassification && persistedClassification.state === "draft") || !!classificationPending) &&
    !classificationApplied;

  const canApplyClassification =
    (persistedClassification?.state === "draft" || !!classificationPending) && !applied.has("classification");

  const hasSummary = summaryPending !== null || !!persistedSummary;

  // Auto-generar la respuesta sugerida al entrar, siempre.
  useEffect(() => {
    if (!canUseLlm || autoReplyGenerated || replyPending || replyDraft) return;
    let active = true;
    suggestReply
      .mutateAsync({ ticketId })
      .then((result) => {
        if (!active) return;
        setReplyDraft(result.suggested_reply);
        setPending((prev) => [
          ...prev.filter((p) => p.kind !== "reply"),
          { kind: "reply", reply: result },
        ]);
      })
      .catch(() => {
        // silencioso: hoy se regenera a demanda
      })
      .finally(() => {
        if (active) setAutoReplyGenerated(true);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseLlm, autoReplyGenerated, ticketId]);

  const sendFeedback = useCallback(
    async (suggestionId: number, action: LlmFeedbackAction, editedOutput?: Record<string, unknown>) => {
      const payload = editedOutput
        ? { ticketId, suggestion_id: suggestionId, action, edited_output: editedOutput }
        : { ticketId, suggestion_id: suggestionId, action };
      await feedback.mutateAsync(payload);
      toast.success(`Feedback registrado: ${FEEDBACK_LABELS[action]}`);
    },
    [feedback, ticketId]
  );

  const regenerateClassification = async () => {
    try {
      const result = await classify.mutateAsync({ ticketId });
      setPending((prev) => [
        ...prev.filter((p) => p.kind !== "classification"),
        { kind: "classification", classification: result },
      ]);
      setApplied((prev) => {
        const next = new Set(prev);
        next.delete("classification");
        return next;
      });
      setEditing(null);
      toast.success("Clasificación regenerada.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo regenerar la clasificación.");
    }
  };

  const regenerateSummary = async () => {
    try {
      const result = await summarize.mutateAsync({ ticketId });
      setPending((prev) => [
        ...prev.filter((p) => p.kind !== "summary"),
        { kind: "summary", summary: result },
      ]);
      setApplied((prev) => {
        const next = new Set(prev);
        next.delete("summary");
        return next;
      });
      setEditing(null);
      toast.success("Resumen regenerado.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo regenerar el resumen.");
    }
  };

  const regenerateReply = async () => {
    try {
      const result = await suggestReply.mutateAsync({ ticketId });
      setReplyDraft(result.suggested_reply);
      setPending((prev) => [
        ...prev.filter((p) => p.kind !== "reply"),
        { kind: "reply", reply: result },
      ]);
      toast.success("Respuesta regenerada.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo regenerar la respuesta.");
    }
  };

  const prepareClassificationDraft = () => {
    const src = classificationPending ?? (persistedClassification
      ? llmClassificationFromOutput(persistedClassification)
      : null);
    if (!src) return;
    setDraftCategory(src.category);
    setDraftPriority(src.suggested_priority);
    setEditing("classification");
  };

  const prepareSummaryDraft = () => {
    const src = summaryPending?.summary ?? (persistedSummary
      ? String(persistedSummary.output.summary ?? "")
      : "");
    setDraftSummary(src);
    setEditing("summary");
  };

  const applyClassification = async () => {
    if (!ticket) return;
    const src = classificationPending ?? (persistedClassification
      ? llmClassificationFromOutput(persistedClassification)
      : null);
    if (!src) return;
    try {
      await updateTicket.mutateAsync({ category: src.category, priority: src.suggested_priority ?? undefined });
      // marcar como aplicada + feedback accepted
      const suggestionId = src.suggestion_id;
      if (suggestionId && !applied.has("classification")) {
        await sendFeedback(suggestionId, "accepted");
      }
      setPending((prev) => prev.filter((p) => p.kind !== "classification"));
      setApplied((prev) => new Set(prev).add("classification"));
      void ticketSuggestions.refetch();
      toast.success("Clasificación aplicada al ticket.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo aplicar la clasificación.");
    }
  };

  const saveEditedClassification = async () => {
    if (!ticket) return;
    try {
      await updateTicket.mutateAsync({
        category: draftCategory,
        priority: draftPriority ?? undefined,
      });
      const suggestionId = classificationPending?.suggestion_id ?? persistedClassification?.id;
      if (suggestionId && !applied.has("classification")) {
        await sendFeedback(suggestionId, "edited");
      }
      setPending((prev) => prev.filter((p) => p.kind !== "classification"));
      setEditing(null);
      setApplied((prev) => new Set(prev).add("classification"));
      void ticketSuggestions.refetch();
      toast.success("Clasificación aplicada.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo aplicar la clasificación.");
    }
  };

  const applySummary = async () => {
    if (!summaryPending) return;
    try {
      const suggestionId = summaryPending.suggestion_id;
      if (suggestionId && !applied.has("summary")) {
        await sendFeedback(suggestionId, summaryEdited(summaryPending.summary, summaryPending) ? "edited" : "accepted", {
          summary: summaryPending.summary,
        });
      }
      setApplied((prev) => new Set(prev).add("summary"));
      toast.success("Resumen guardado.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar el resumen.");
    }
  };

  const saveEditedSummary = async () => {
    const base = summaryPending
      ? { ...summaryPending }
      : persistedSummary
        ? llmSummarizeFromOutput(persistedSummary)
        : null;
    if (!base) return;
    try {
      const suggestionId = base.suggestion_id;
      if (suggestionId && !applied.has("summary")) {
        await sendFeedback(suggestionId, "edited", { summary: draftSummary });
      }
      setPending((prev) => [
        ...prev.filter((p) => p.kind !== "summary"),
        { kind: "summary", summary: { ...base, summary: draftSummary } },
      ]);
      setEditing(null);
      setApplied((prev) => new Set(prev).add("summary"));
      toast.success("Resumen guardado.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar el resumen.");
    }
  };

  const useReply = () => {
    if (!replyDraft.trim()) return;
    const changed = replyPending
      ? replyDraft !== replyPending.suggested_reply
      : true;
    onUseReply?.(replyDraft);
    if (replyPending?.suggestion_id && !applied.has("reply")) {
      void sendFeedback(replyPending.suggestion_id, changed ? "edited" : "accepted");
    }
  };

  const pendingCount =
    (canApplyClassification ? 1 : 0) +
    (summaryPending && !applied.has("summary") ? 1 : 0);

  // Bloqueo de salida suave (FR-06): aviso al recargar/cerrar con cambios pendientes
  useEffect(() => {
    if (pendingCount === 0) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [pendingCount]);

  if (!canUseLlm) {
    return (
      <aside aria-label="Asistente IA" className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <ShieldAlertIcon className="mx-auto mb-2 size-6 text-risk-pii" aria-hidden />
          <p className="text-sm font-medium">Asistente IA no disponible</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tu rol no tiene permiso para usar el asistente con IA.
          </p>
        </div>
      </aside>
    );
  }

  const busy = classify.isPending || summarize.isPending || suggestReply.isPending || updateTicket.isPending;

  return (
    <aside aria-label="Asistente IA" className="space-y-4">
      <div className="rounded-lg border border-content-llm-border/40 bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <SparklesIcon className="size-4 text-llm" aria-hidden />
            <h2 className="text-sm font-semibold">Asistente IA</h2>
          </div>
        </div>

        <div className="space-y-4 p-4">
          {/* Banner de pendientes */}
          {pendingCount > 0 && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
            >
              <AlertTriangleIcon className="size-4 shrink-0" aria-hidden />
              <span>Tenés que confirmar los cambios pendientes.</span>
            </div>
          )}
          {/* Spinner mientras cargan las sugerencias */}
          {isLoadingPanel ? (
            <div className="flex items-center justify-center py-10" aria-label="Cargando sugerencias">
              <Loader2Icon className="size-6 animate-spin text-muted-foreground" aria-hidden />
            </div>
          ) : (
            <>
              <p className="rounded-md bg-content-llm-bg px-3 py-2 text-xs text-muted-foreground">
                {DISCLAIMER}
              </p>

              {/* Error de carga */}
              {ticketSuggestions.isError && (
                <ErrorState
                  message="No se pudieron cargar las sugerencias."
                  onRetry={() => ticketSuggestions.refetch()}
                />
              )}

              {/* Sección Sugerencias: Clasificación + Resumen */}
              <div className="space-y-3">
                {/* Clasificación */}
                {classificationVisible && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Clasificación
                      </h3>
                      <SectionMenu
                        onApply={() => void applyClassification()}
                        onEdit={prepareClassificationDraft}
                        onRegenerate={() => void regenerateClassification()}
                        canApply={canApplyClassification}
                        disabled={busy}
                      />
                    </div>
                    <div className="space-y-2 rounded-md border border-border bg-background/40 p-3">
                      {classificationVisible ? (
                        editing === "classification" ? (
                          <div className="space-y-2">
                            <Select
                              value={draftCategory}
                              onValueChange={setDraftCategory}
                              disabled={categoriesLoading}
                            >
                              <SelectTrigger aria-label="Categoría">
                                <SelectValue placeholder="Seleccioná una categoría" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map(({ value, label }) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={draftPriority ?? "none"}
                              onValueChange={(value) =>
                                setDraftPriority(value === "none" ? null : (value as TicketPriority))
                              }
                            >
                              <SelectTrigger aria-label="Prioridad">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Sin prioridad</SelectItem>
                                {(Object.entries(PRIORITY_LABELS) as Array<[TicketPriority, string]>).map(
                                  ([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                      {label}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                            <div className="flex justify-end gap-1.5">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setEditing(null)}
                                disabled={busy}
                              >
                                Cancelar
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => void saveEditedClassification()}
                                disabled={busy}
                              >
                                <CheckIcon aria-hidden />
                                Aplicar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge>
                              {classificationPending?.category ??
                                (persistedClassification ? String(persistedClassification.output.category ?? "") : "")}
                            </Badge>
                            <Badge variant="outline">
                              {PRIORITY_LABELS[
                                (classificationPending?.suggested_priority ??
                                  (persistedClassification?.output.suggested_priority as TicketPriority | undefined) ??
                                  null) as TicketPriority
                              ] ?? "Sin prioridad"}
                            </Badge>
                          </div>
                        )
                      ) : null}
                    </div>
                  </div>
                )}

                {/* Resumen */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Resumen
                    </h3>
                    {hasSummary ? (
                      <SectionMenu
                        onApply={() => void applySummary()}
                        onEdit={prepareSummaryDraft}
                        onRegenerate={() => void regenerateSummary()}
                        canApply={!!summaryPending && !applied.has("summary")}
                        disabled={busy}
                      />
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void regenerateSummary()}
                        disabled={busy}
                      >
                        <RefreshCwIcon className="size-3.5" aria-hidden />
                        Resumir
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2 rounded-md border border-border bg-background/40 p-3">
                    {editing === "summary" ? (
                      <div className="space-y-2">
                        <Textarea
                          aria-label="Resumen"
                          rows={5}
                          value={draftSummary}
                          onChange={(event) => setDraftSummary(event.target.value)}
                        />
                        <div className="flex justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditing(null)}
                            disabled={busy}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void saveEditedSummary()}
                            disabled={busy}
                          >
                            <CheckIcon aria-hidden />
                            Aplicar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {(summaryPending?.summary ??
                          (persistedSummary ? String(persistedSummary.output.summary ?? "") : "")) ||
                          "Sin resumen."}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Artículos recomendados */}
              <div className="space-y-2 border-t border-border pt-4">
                <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <BookOpenIcon className="size-3.5" aria-hidden />
                  Artículos recomendados
                </h3>
                <div className="space-y-1.5 rounded-md border border-border bg-background/40 p-3">
                  {articlesLoading ? (
                    <p className="text-xs text-muted-foreground">Cargando artículos…</p>
                  ) : recommendedArticles.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No hay artículos publicados para la categoría actual.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {recommendedArticles.map((article) => (
                        <li key={article.id}>
                          <a
                            href={`/${tenantSlug}/app/knowledge/articles/${article.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="line-clamp-2 text-xs font-medium text-foreground underline-offset-2 hover:underline"
                            title={article.title}
                          >
                            {article.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Respuesta sugerida */}
              <div className="space-y-2 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Respuesta sugerida
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void regenerateReply()}
                    disabled={busy}
                  >
                    {suggestReply.isPending ? (
                      <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
                    ) : (
                      <RefreshCwIcon className="size-3.5" aria-hidden />
                    )}
                    Regenerar
                  </Button>
                </div>
                <div className="space-y-3">
                  <Textarea
                    rows={6}
                    value={replyDraft}
                    onChange={(event) => setReplyDraft(event.target.value)}
                    aria-label="Respuesta de la IA"
                    disabled={busy}
                  />
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      onClick={useReply}
                      disabled={!replyDraft.trim()}
                    >
                      <PenLineIcon className="size-3.5" aria-hidden />
                      Usar como respuesta
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

function llmClassificationFromOutput(s: SuggestionRecord): LlmClassifyOutput {
  const output = s.output as { category?: string; suggested_priority?: string };
  return {
    category: output.category ?? "",
    suggested_priority: (output.suggested_priority as LlmClassifyOutput["suggested_priority"]) ?? null,
    confidence: s.confidence ?? 0,
    warnings: [],
    suggestion_id: s.id,
    trace_id: "",
  };
}

function llmSummarizeFromOutput(s: SuggestionRecord): LlmSummarizeOutput {
  return {
    summary: String(s.output?.summary ?? ""),
    missing_information: null,
    confidence: s.confidence ?? 0,
    warnings: [],
    suggestion_id: s.id,
    trace_id: "",
  };
}

function summaryEdited(current: string, s: LlmSummarizeOutput): boolean {
  return current !== s.summary;
}
