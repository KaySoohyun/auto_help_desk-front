"use client";

import { useState } from "react";
import { useLlm } from "@/hooks/llm/useLlm";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftCircle, Dice1, MessageCircle } from "lucide-react";

export function LlmSidebar() {
  const [activeTab, setActiveTab] = useState<"classify" | "summarize" | "chat">("classify");

  const { classifyMutation, summarizeMutation, chatMutation } = useLlm();

  const [formData, setFormData] = useState({
    classify: "",
    summarize: "",
    chat: "",
  });

  const [outputs, setOutputs] = useState<{
    classify?: {
      categories: Array<{ id: string; name: string; score: number }>;
    };
    summarize?: { summary: Array<{ title: string; text: string }> };
    chat?: { response: string };
  }>({});

  const [loading, setLoading] = useState<{ classify?: boolean; summarize?: boolean; chat?: boolean }>({});

  const handleClassify = async () => {
    if (!formData.classify.trim()) return;
    setLoading((p) => ({ ...p, classify: true }));
    try {
      const result = await classifyMutation.mutateAsync({ text: formData.classify });
      setOutputs({ ...outputs, classify: result });
    } catch {
      // error handling simple
    } finally {
      setLoading((p) => ({ ...p, classify: false }));
    }
  };

  const handleSummarize = async () => {
    if (!formData.summarize.trim()) return;
    setLoading((p) => ({ ...p, summarize: true }));
    try {
      const result = await summarizeMutation.mutateAsync({ text: formData.summarize });
      setOutputs({ ...outputs, summarize: { summary: result.summary || "No summary generated" } });
    } catch {
      // error handling simple
    } finally {
      setLoading((p) => ({ ...p, summarize: false }));
    }
  };

  const handleChat = async () => {
    if (!formData.chat.trim()) return;
    setLoading((p) => ({ ...p, chat: true }));
    try {
      const result = await chatMutation.mutateAsync({ message: formData.chat });
      setOutputs({ ...outputs, chat: { response: result.response || "No response generated" } });
    } catch {
      // error handling simple
    } finally {
      setLoading((p) => ({ ...p, chat: false }));
    }
  };

  const tabHandlers = {
    classify: handleClassify,
    summarize: handleSummarize,
    chat: handleChat,
  };

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col border-r border-border bg-sidebar text-sm",
        "w-64"
      )}
      aria-label="Panel LLM"
    >
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
          LLM
        </div>
      </div>

      <nav className="flex-1 space-y-6 p-3">
        <div className="border-b border-border pb-3 mb-4">
          <button
            key="classify"
            onClick={() => setActiveTab("classify")}
            className={cn(
              "w-full flex items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              activeTab === "classify"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground"
            )}
            aria-selected={activeTab === "classify"}
          >
            <span className="flex items-center gap-1">
              <ArrowLeftCircle className="size-4 shrink-0" aria-hidden />
              {" Clasificar"}
            </span>
          </button>
          <button
            key="summarize"
            onClick={() => setActiveTab("summarize")}
            className={cn(
              "w-full flex items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              activeTab === "summarize"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground"
            )}
            aria-selected={activeTab === "summarize"}
          >
            <span className="flex items-center gap-1">
              <Dice1 className="size-4 shrink-0" aria-hidden />
              {" Resumir"}
            </span>
          </button>
          <button
            key="chat"
            onClick={() => setActiveTab("chat")}
            className={cn(
              "w-full flex items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              activeTab === "chat"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground"
            )}
            aria-selected={activeTab === "chat"}
          >
            <span className="flex items-center gap-1">
              <MessageCircle className="size-4 shrink-0" aria-hidden />
              {" Chat"}
            </span>
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium text-sidebar-foreground">{activeTab}</h3>

          <Input
            placeholder="Escribe texto..."
            value={formData[activeTab]}
            onChange={(e) => setFormData({ ...formData, [activeTab]: (e.target.value as string) })}
          />

          <div className="flex gap-2">
            <Button onClick={tabHandlers[activeTab]} disabled={loading[activeTab] ?? false} className="flex-1">
              {loading[activeTab] ? "Enviando..." : "Enviar"}
            </Button>
            <Button
              onClick={() => setFormData({ ...formData, [activeTab]: "" })}
              variant="outline"
              size="sm"
              className="px-2"
            >
              Descartar
            </Button>
          </div>

          <Badge className="mt-2 text-xs" variant="secondary">
            Salida generada por IA. Verificar antes de usar.
          </Badge>

          {activeTab === "classify" && outputs.classify && (
            <div className="mt-3 p-3 rounded-md border border-border bg-sidebar/50 text-xs">
              <strong>Categorías sugeridas:</strong>
              <ul className="mt-1 text-xs">
                {outputs.classify.categories.map((c, i) => (
                  <li key={i}>
                    {c.name} <span className="text-muted-foreground">({c.score}%)</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === "summarize" && outputs.summarize && (
            <div className="mt-3 p-3 rounded-md border border-border bg-sidebar/50 text-xs">
              <strong>Resumen:</strong>
              <p className="text-xs">
                {outputs.summarize.summary.length > 0 ? outputs.summarize.summary[0].text : "No summary generated"}
              </p>
            </div>
          )}

          {activeTab === "chat" && outputs.chat && (
            <div className="mt-3 p-3 rounded-md border border-border bg-sidebar/50 text-xs">
              <strong>Respuesta:</strong>
              <p className="text-xs break-all">{outputs.chat.response}</p>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}