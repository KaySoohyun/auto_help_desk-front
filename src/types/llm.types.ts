export interface LlmClassifyInput {
  ticketId: number;
}

export interface LlmClassifyOutput {
  category: string;
  suggested_priority: "low" | "medium" | "high" | "urgent" | null;
  confidence: number;
  warnings: string[];
  suggestion_id: number;
  trace_id: string;
}

export interface LlmSummarizeInput {
  ticketId: number;
}

export interface LlmSummarizeOutput {
  summary: string;
  missing_information: string | null;
  confidence: number;
  warnings: string[];
  suggestion_id: number;
  trace_id: string;
}

export interface LlmSuggestReplyInput {
  ticketId: number;
  tone?: string;
  language?: string;
}

export interface LlmSuggestReplyOutput {
  suggested_reply: string;
  confidence: number;
  sources: string[];
  policy_flags: string[];
  warnings: string[];
  suggestion_id: number;
  trace_id: string;
}

export type LlmFeedbackAction = "accepted" | "edited" | "rejected" | "flagged";

export interface LlmFeedbackInput {
  ticketId: number;
  suggestion_id: number;
  action: LlmFeedbackAction;
  reason?: string;
}

export interface LlmFeedbackOutput {
  suggestion_id: number;
  action: LlmFeedbackAction;
  reason: string | null;
  edited_content_hash: string | null;
  created_at: string;
}

export type LlmPiiRedactMode = "off" | "detect" | "redact";

export interface LlmPiiRedactInput {
  text: string;
  mode?: LlmPiiRedactMode;
}

export interface LlmPiiRedactOutput {
  text: string;
  report: {
    types: Record<string, number>;
    total: number;
  };
}

export interface LlmChatInput {
  ticketId: number;
  tone?: string;
  language?: string;
}

export type LlmChatOutput = LlmSuggestReplyOutput;

export interface LlmStreamInput {
  ticketId: number;
  tone?: string;
  language?: string;
}

export interface LlmStreamToken {
  token: string;
  confidence: number;
  done: boolean;
  trace_id: string;
}

export type LlmRiskLevel = "low" | "medium" | "high";

export type LlmRiskKind =
  | "low_confidence"
  | "hallucination"
  | "pii"
  | "prompt_injection"
  | "insufficient_context"
  | "policy"
  | "warning";

export interface LlmRisk {
  kind: LlmRiskKind;
  level: LlmRiskLevel;
  message: string;
}

export interface LlmRiskEvaluation {
  risks: LlmRisk[];
  blocked: boolean;
}

// Tipos para el endpoint /analyze (Feature 012)
export interface KbRecommendation {
  article_id: number;
  title: string;
  score: number;
}

export interface PiiDetection {
  type: string;
  value: string;
  position: number;
}

export interface LlmAnalyzeOutput {
  classification: LlmClassifyOutput | { error: string };
  summary: LlmSummarizeOutput | { error: string };
  suggested_reply: LlmSuggestReplyOutput | { error: string };
  kb_recommendations: KbRecommendation[];
  pii_detected: PiiDetection[];
  risks: string[];
}

export type SuggestionType = "classification" | "summary" | "reply";

export type SuggestionState = "draft" | "accepted" | "edited" | "rejected" | "flagged";

export interface SuggestionRecord {
  id: number;
  type: SuggestionType;
  state: SuggestionState;
  confidence: number | null;
  model: string | null;
  prompt_version: string | null;
  output: Record<string, unknown>;
  created_at: string;
}

export interface LlmFeedbackEditInput extends LlmFeedbackInput {
  edited_output?: Record<string, unknown>;
}
