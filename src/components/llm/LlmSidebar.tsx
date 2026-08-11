"use client";

import { useState } from "react";
import { useLlm } from "@/hooks/llm/useLlm";

export function LlmSidebar() {
  const [activeTab, setActiveTab] = useState("classify");

  const {
    classifyMutation,
    summarizeMutation,
    chatMutation,
    streamMutation,
    suggestMutation,
    feedbackMutation,
  } = useLlm();

  const [formData, setFormData] = useState({
    classify: "",
    summarize: "",
    chat: "",
    suggest: "",
    stream: "",
  });

  const [outputs, setOutputs] = useState({
    classify: undefined,
    summarize: undefined,
    chat: undefined,
    suggest: undefined,
    stream: undefined,
  });

  // Simplified loading state as any to avoid type issues
  const [loading, setLoading] = useState<any>({});

  // Handlers
  const handleClassify = async () => {
    if (!formData.classify.trim()) return;
    setLoading({ classify: true });
    try { await classifyMutation.mutateAsync({ text: formData.classify }); } catch {}
    finally { setLoading({ classify: false }); }
  };

  const handleSummarize = async () => {
    if (!formData.summarize.trim()) return;
    setLoading({ summarize: true });
    try { await summarizeMutation.mutateAsync({ text: formData.summarize }); } catch {}
    finally { setLoading({ summarize: false }); }
  };

  const handleChat = async () => {
    if (!formData.chat.trim()) return;
    setLoading({ chat: true });
    try { await chatMutation.mutateAsync({ message: formData.chat }); } catch {}
    finally { setLoading({ chat: false }); }
  };

  const handleSuggest = async () => {
    if (!formData.suggest.trim()) return;
    setLoading({ suggest: true });
    try { await suggestMutation.mutateAsync({ text: formData.suggest }); } catch {}
    finally { setLoading({ suggest: false }); }
  };

  const handleStream = async () => {
    if (!formData.stream.trim()) return;
    setLoading({ stream: true });
    try { await streamMutation.mutateAsync({ text: formData.stream }); } catch {}
    finally { setLoading({ stream: false }); }
  };

  const handleFeedback = async (action) => {
    try { await feedbackMutation.mutateAsync({ action, ticketId: 1 }); } catch {}
    setLoading({ stream: false });
  };

  const tabOptions = [
    { key: "classify", label: "Clasificar" },
    { key: "summarize", label: "Resumir" },
    { key: "chat", label: "Chat" },
    { key: "suggest", label: "Sugerencias" },
    { key: "stream", label: "Streaming" },
  ];

  const activeTabOption = tabOptions.find((t) => t.key === activeTab) || tabOptions[0];

  return (
    <aside>
      <nav>
        <div>
          {[...tabOptions].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}>
              {tab.label}
            </button>
          })}
        </div>

        <div>
          <h3>{activeTabOption.label}</h3>
          <input placeholder="Escribe texto..." value={formData[activeTab]} onChange={(e) => setFormData({ ...formData, [activeTab]: e.target.value })} />
          <button onClick={tabHandlers[activeTab] ?? handleClassify}>Enviar</button>
          <button variant="outline" onClick={() => setFormData({ ...formData, [activeTab]: "" })>Descartar</button>

          <div>
            {activeTab === "classify" && outputs.classify && <div>Categorías: {outputs.classify.categories.length}</div>}
          {activeTab === "summarize" && outputs.summarize && <div>Resumen: {outputs.summarize.summary}</div>}
          {activeTab === "chat" && outputs.chat && <div>Respuesta: {outputs.chat.response}</div>}
          {activeTab === "suggest" && outputs.suggest && <div>{outputs.suggest.suggestions?.map((s) => `${s.label}: ${s.description}`).join(". ")}</div>}
          {activeTab === "stream" && outputs.stream && <div>Streaming: {outputs.stream?.tokens.map((t) => t.value).join(" ") ?? "—"}</div>}

          {activeTab === "stream" && (
            <div>
              <button onClick={() => handleFeedback("accept")}>Aceptar</button>
              <button variant="outline" onClick={() => handleFeedback("reject")}>Rechazar</button>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
}