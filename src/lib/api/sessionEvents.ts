type SessionExpiredListener = () => void;

const listeners = new Set<SessionExpiredListener>();

let lastEmittedAt = 0;
const EMIT_COOLDOWN_MS = 10_000;

export function onSessionExpired(listener: SessionExpiredListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitSessionExpired(): void {
  const now = Date.now();
  if (now - lastEmittedAt < EMIT_COOLDOWN_MS) return;
  lastEmittedAt = now;
  listeners.forEach((listener) => listener());
}
