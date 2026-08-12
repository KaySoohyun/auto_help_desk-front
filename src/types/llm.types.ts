export interface LlmClassifyInput {
  ticketId: number;
}

export interface LlmClassifyOutput {
  category: string;
  subcategory: string | null;
  intent: string;
  suggested_priority: "low" | "medium" | "high" | "urgent" | null;
  confidence: number;
  rationale: string;
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
