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

  return {
    classifyMutation,
    summarizeMutation,
    chatMutation,
  };
}