# 005 · Panel LLM avanzado — Tasks

Estado: completado. Marcar `[ ]` pendiente y `[x]` al completar.

## T1 · BFF endpoints

- [x] Crear `src/app/api/bff/llm/stream/route.ts` con fetch a FastAPI + auth header + handling SSE.
- [x] Crear `src/app/api/bff/llm/suggest/route.ts` devuelve 3 sugerencias basadas en contexto del ticket.
- [x] Crear `src/app/api/bff/llm/feedback/route.ts` registra feedback en tabla `llm_feedback`.
- [x] Verificar tipos de respuesta FastAPI y mapear a `ApiError` local.

## T2 · Tipos y hooks

- [x] Extender `src/types/llm.types.ts` con `LlmStreamInput/Output`, `LlmSuggestInput/Output`, `LlmFeedbackInput/Output`.
- [x] Extender hook `src/hooks/llm/useLlm.ts` con mutaciones `useLlmStream`, `useLlmSuggest`, `useLlmFeedback`.
- [x] Configurar query keys: `['tenant', tenantId, 'llm', 'stream']`, etc.

## T3 · Panel lateral UI

- [x] Crear actualización en `src/components/llm/LlmSidebar.tsx` con pestaña **Sugerencias**.
- [x] Pestaña **Sugerencias** muestra 3 inputs con texto prellenado y botón "Usar sugerencia".
- [x] Pestaña **Streaming** muestra textarea con output en tiempo real (tokens apareciendo).
- [x] Cada token/sugerencia muestra score de confianza (0-100).
- [x] Botón **Feedback** (Aceptar/Editar/Regenerar/Rechazar) guarda registro en backend.
- [x] Filtros de PII: textos con datos sensibles son marcados y opcionalmente masked antes del envío.
- [ ] Estados: streaming (tokens incremental), error (mensaje + reintentar), conectado, desconectado.

## T4 · Integración y cierre

- [ ] `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde (0 errores, 0 warnings).
- [ ] Prueba contra FastAPI real con usuario con ticket abierto: panel visible, pestañas funcionan, streaming en tiempo real.
- [ ] Verificar feedback se guarda en backend y es consultable por auditores.
- [ ] Verificar a11y: keyboard navigation entre tabs, contraste AA, labels aria.
- [ ] Documentar en `ia-docs/init/changes.md` y actualizar `arquitecture.md` (nuevos endpoints y panel).
- [ ] Mover 005 a "Hecho" en `ia-docs/constitution/roadmap.md`.