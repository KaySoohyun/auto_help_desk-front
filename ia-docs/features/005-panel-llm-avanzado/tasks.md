# 005 · Panel LLM avanzado — Tasks

Estado: implementado. Marcar `[ ]` pendiente y `[x]` al completar.

## T1 · BFF endpoints

- [x] Crear `src/app/api/bff/llm/stream/route.ts` con fetch a FastAPI + auth header + handling SSE (Server-Sent Events).
- [x] ~~Crear `src/app/api/bff/llm/suggest/route.ts`~~ **Eliminado**: `/v1/ai/tickets/{id}/suggest` no existe en el backend real.
- [x] Crear `src/app/api/bff/llm/chat/route.ts` → repuntado a `POST /v1/ai/tickets/{id}/suggested-reply` (alineado al backend real).
- [x] `feedback/route.ts` ya existía (004).
- [x] Verificar tipos de respuesta FastAPI y mapear a `ApiError` local (vía `authenticatedFetch`).

## T2 · Tipos y hooks

- [x] Extender `src/types/llm.types.ts` con `LlmChatInput/Output`, `LlmStreamInput`, `LlmStreamToken` (eliminados `LlmSuggestInput/Output` y `LlmSuggestionItem` por inexistencia del endpoint).
- [x] Extender hook `src/hooks/llm/useLlm.ts` con mutaciones `chat`, `suggestReply` y función `startStream`.
- [x] `startStream` reescrito: devuelve cleanup sincrónico (cancelación real vía `AbortController`), parsea el evento SSE único y lo emite chunked como tokens en tiempo real.
- [x] Configurar query keys: `['tenant', tenantId, 'llm', 'chat']`, etc.

## T3 · Panel lateral UI

- [x] Actualizar `src/components/llm/LlmAssistantPanel.tsx` (era `LlmSidebar.tsx` en la spec) con pestaña **Chat**, **Sugerencias** y **Streaming**.
- [x] Pestaña **Sugerencias** muestra 3 respuestas con tonos distintos (formal/empático/conciso vía `suggested-reply`), textarea editable, confianza y botón "Usar sugerencia".
- [x] Pestaña **Streaming** muestra textarea con output en tiempo real (tokens chunked via SSE) + botón cancelar (funcional).
- [x] Cada salida muestra score de confianza (0-100) en `ConfidenceBadge`.
- [x] Botón **Feedback** (Aceptar/Editar/Regenerar/Rechazar/Marcar) guarda registro en backend vía `useLlm().feedback`.
- [x] Filtros de PII: `PiiDetectionList` en tab Chat; botón "Redactar PII" vía `/api/bff/llm/pii-redact`.
- [x] Estados: streaming (tokens incrementales), error (mensaje + reintentar), conectado/desconectado (cancelar).
- [x] Renombrado `useReplyInComposer` → `applyChatInComposer` (evita falseo de react-hooks).
- [x] Removida prop `suggestionId` huérfed de `FeedbackRow`.

## T4 · Integración y cierre

- [x] `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde (0 errores, 0 warnings).
- [ ] Prueba contra FastAPI real con usuario con ticket abierto: panel visible, pestañas funcionan, streaming en tiempo real.
- [ ] Verificar feedback se guarda en backend y es consultable por auditores.
- [ ] Verificar a11y: keyboard navigation entre tabs, contraste AA, labels aria.
- [x] Documentar en `ia-docs/init/changes.md` y actualizar `arquitecture.md` (nuevos endpoints y panel).
- [ ] Mover 005 a "Hecho" en `ia-docs/constitution/roadmap.md`.
