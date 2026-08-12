export const MIN_CONTEXT_CHARS = 200;

export function isInsufficientContext(text: string | null | undefined): boolean {
  if (!text || text.trim().length === 0) return true;
  return text.trim().length < MIN_CONTEXT_CHARS;
}

export function buildTicketContext({
  subject,
  description,
  messages,
}: {
  subject?: string | null;
  description?: string | null;
  messages?: Array<{ body?: string | null }> | null;
}): string {
  const parts: string[] = [];
  if (subject && subject.trim()) parts.push(subject.trim());
  if (description && description.trim()) parts.push(description.trim());
  for (const message of messages ?? []) {
    if (message?.body && message.body.trim()) parts.push(message.body.trim());
  }
  return parts.join("\n");
}
