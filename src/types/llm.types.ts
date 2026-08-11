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