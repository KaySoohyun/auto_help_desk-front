"use client";

import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { useSessionStore } from "@/stores/session.store";
import type {
  LlmClassifyInput,
  LlmClassifyOutput,
  LlmSummarizeInput,
  LlmSummarizeOutput,
  LlmSuggestReplyInput,
  LlmSuggestReplyOutput,
  LlmFeedbackInput,
  LlmFeedbackOutput,
  LlmPiiRedactInput,
  LlmPiiRedactOutput,
  LlmChatInput,
  LlmChatOutput,
  LlmStreamInput,
  LlmStreamToken,
} from "@/types/llm.types";

export interface StreamHandlers {
  onToken: (token: LlmStreamToken) => void;
  onError?: (err: Error) => void;
  onDone?: () => void;
}

export function useLlm() {
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);

  const classify = useMutation({
    mutationKey: ["tenant", tenantId ?? "global", "llm", "classify"],
    mutationFn: (vars: LlmClassifyInput) =>
      bffFetch<LlmClassifyOutput>("/api/bff/llm/classify", {
        method: "POST",
        body: vars,
      }),
  });

  const summarize = useMutation({
    mutationKey: ["tenant", tenantId ?? "global", "llm", "summarize"],
    mutationFn: (vars: LlmSummarizeInput) =>
      bffFetch<LlmSummarizeOutput>("/api/bff/llm/summarize", {
        method: "POST",
        body: vars,
      }),
  });

  const suggestReply = useMutation({
    mutationKey: ["tenant", tenantId ?? "global", "llm", "suggest-reply"],
    mutationFn: (vars: LlmSuggestReplyInput) =>
      bffFetch<LlmSuggestReplyOutput>("/api/bff/llm/suggest-reply", {
        method: "POST",
        body: vars,
      }),
  });

  const feedback = useMutation({
    mutationKey: ["tenant", tenantId ?? "global", "llm", "feedback"],
    mutationFn: (vars: LlmFeedbackInput) =>
      bffFetch<LlmFeedbackOutput>("/api/bff/llm/feedback", {
        method: "POST",
        body: vars,
      }),
  });

  const piiRedact = useMutation({
    mutationKey: ["tenant", tenantId ?? "global", "llm", "pii-redact"],
    mutationFn: (vars: LlmPiiRedactInput) =>
      bffFetch<LlmPiiRedactOutput>("/api/bff/llm/pii-redact", {
        method: "POST",
        body: vars,
      }),
  });

  const chat = useMutation({
    mutationKey: ["tenant", tenantId ?? "global", "llm", "chat"],
    mutationFn: (vars: LlmChatInput) =>
      bffFetch<LlmChatOutput>("/api/bff/llm/chat", {
        method: "POST",
        body: vars,
      }),
  });

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<Error | null>(null);

  const CHUNK_SIZE = 6;
  const CHUNK_DELAY_MS = 12;

  const emitChunks = async (
    text: string,
    confidence: number,
    traceId: string,
    signal: AbortSignal,
    onToken: (token: LlmStreamToken) => void
  ) => {
    const chunks = text.match(new RegExp(`.{1,${CHUNK_SIZE}}`, "gs")) ?? [];
    for (const chunk of chunks) {
      if (signal.aborted) return;
      onToken({ token: chunk, confidence, done: false, trace_id: traceId });
      await new Promise((resolve) => setTimeout(resolve, CHUNK_DELAY_MS));
    }
  };

  const startStream = useCallback(
    (vars: LlmStreamInput, handlers: StreamHandlers): (() => void) => {
      setIsStreaming(true);
      setStreamError(null);
      const controller = new AbortController();
      let cancelled = false;

      const cleanup = () => {
        cancelled = true;
        controller.abort();
        setIsStreaming(false);
      };

      void (async () => {
        try {
          const res = await fetch("/api/bff/llm/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(vars),
            signal: controller.signal,
          });

          if (!res.ok) {
            let message = `Error ${res.status}.`;
            try {
              const data = await res.json();
              if (data && typeof data.error === "string") message = data.error;
            } catch {
              /* sin body JSON */
            }
            const err = new Error(message);
            setStreamError(err);
            handlers.onError?.(err);
            return;
          }

          const reader = res.body?.getReader();
          if (!reader) {
            const err = new Error("No se pudo leer el stream.");
            setStreamError(err);
            handlers.onError?.(err);
            return;
          }

          const decoder = new TextDecoder();
          let buffer = "";
          let receivedPayload = false;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              let parsed: unknown;
              try {
                parsed = JSON.parse(line.slice(6));
              } catch {
                continue;
              }

              if (
                typeof parsed === "object" &&
                parsed !== null &&
                "token" in parsed &&
                typeof (parsed as { token: unknown }).token === "string"
              ) {
                const token = parsed as unknown as LlmStreamToken;
                if (controller.signal.aborted) return;
                handlers.onToken(token);
                continue;
              }

              const payload = parsed as Partial<LlmChatOutput>;
              if (typeof payload.suggested_reply === "string") {
                receivedPayload = true;
                const confidence = typeof payload.confidence === "number" ? payload.confidence : 0;
                const traceId = typeof payload.trace_id === "string" ? payload.trace_id : "";
                await emitChunks(
                  payload.suggested_reply,
                  confidence,
                  traceId,
                  controller.signal,
                  handlers.onToken
                );
              }
            }
          }

          if (cancelled || controller.signal.aborted) return;
          if (receivedPayload) {
            handlers.onToken({
              token: "",
              confidence: 0,
              done: true,
              trace_id: "",
            });
          }
          handlers.onDone?.();
        } catch (err) {
          if (cancelled || (err instanceof Error && err.name === "AbortError")) return;
          const error = err instanceof Error ? err : new Error("Error en el streaming.");
          setStreamError(error);
          handlers.onError?.(error);
        } finally {
          if (!cancelled) {
            setIsStreaming(false);
          }
        }
      })();

      return cleanup;
    },
    []
  );

  return {
    classify,
    summarize,
    suggestReply,
    feedback,
    piiRedact,
    chat,
    startStream,
    isStreaming,
    streamError,
  };
}
