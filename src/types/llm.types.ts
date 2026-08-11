export interface LlmClassifyInput {
  text: string;
}

export interface LlmClassifyOutput {
  categories: Array<{ id: string; name: string; score: number }>;
}

export interface LlmSummarizeInput {
  text: string;
}

export interface LlmSummarizeOutput {
  summary: Array<{ title: string; text: string }>;
}

export interface LlmChatInput {
  message: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface LlmChatOutput {
  response: string;
}

export interface LlmStreamInput {
  text: string;
}

export interface LlmStreamOutput {
  tokens: Array<{ value: string; confidence: number }>;
}

export interface LlmSuggestInput {
  ticketId: number;
  context: string;
}

export interface LlmSuggestOutput {
  suggestions: Array<{
    id: string;
    label: string;
    description: string;
    confidence: number;
  }>;
}

export interface LlmFeedbackInput {
  ticketId: number;
  action: "accept" | "edit" | "regenerate" | "reject";
  userComment?: string;
}

export interface LlmFeedbackOutput {
  success: boolean;
}