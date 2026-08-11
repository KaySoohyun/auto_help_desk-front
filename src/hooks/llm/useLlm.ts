"use client";

import { useMutation } from "@tanstack/react-query";
import { bffFetch } from "@/lib/api/bffClient";
import { useSessionStore } from "@/stores/session.store";
import type {
  LlmClassifyInput,
  LlmClassifyOutput,
  LlmSummarizeInput,
  LlmSummarizeOutput,
  LlmChatInput,
  LlmChatOutput,
  LlmStreamInput,
  LlmStreamOutput,
  LlmSuggestInput,
  LlmSuggestOutput,
  LlmFeedbackInput,
  LlmFeedbackOutput,
} from "@/types/llm.types";

export function useLlm() {
  const tenantId = useSessionStore((s) => s.user?.tenantId ?? null);

  const classifyMutation = useMutation({
    mutationKey: ["tenant", tenantId ?? "global", "llm", "classify"],
    mutationFn: async (vars: LlmClassifyInput) => {
      return await bffFetch<LlmClassifyOutput>("/api/bff/llm/classify", {
        method: "POST",
        body: JSON.stringify(vars),
      });
    },
  });

  const summarizeMutation = useMutation({
    mutationKey: ["tenant", tenantId ?? "global", "llm", "summarize"],
    mutationFn: async (vars: LlmSummarizeInput) => {
      return await bffFetch<LlmSummarizeOutput>("/api/bff/llm/summarize", {
        method: "POST",
        body: JSON.stringify(vars),
      });
    },
  });

  const chatMutation = useMutation({
    mutationKey: ["tenant", tenantId ?? "global", "llm", "chat"],
    mutationFn: async (vars: LlmChatInput) => {
      return await bffFetch<LlmChatOutput>("/api/bff/llm/chat", {
        method: "POST",
        body: JSON.stringify(vars),
      });
    },
  });

  const streamMutation = useMutation({
    mutationKey: ["tenant", tenantId ?? "global", "llm", "stream"],
    mutationFn: async (vars: LlmStreamInput) => {
      return await bffFetch<LlmStreamOutput>("/api/bff/llm/stream", {
        method: "POST",
        body: JSON.stringify(vars),
      });
    },
  });

  const suggestMutation = useMutation({
    mutationKey: ["tenant", tenantId ?? "global", "llm", "suggest"],
    mutationFn: async (vars: LlmSuggestInput) => {
      return await bffFetch<LlmSuggestOutput>("/api/bff/llm/suggest", {
        method: "POST",
        body: JSON.stringify(vars),
      });
    },
  });

  const feedbackMutation = useMutation({
    mutationKey: ["tenant", tenantId ?? "global", "llm", "feedback"],
    mutationFn: async (vars: LlmFeedbackInput) => {
      return await bffFetch<LlmFeedbackOutput>("/api/bff/llm/feedback", {
        method: "POST",
        body: JSON.stringify(vars),
      });
    },
  });

  return {
    classifyMutation,
    summarizeMutation,
    chatMutation,
    streamMutation,
    suggestMutation,
    feedbackMutation,
  };
}