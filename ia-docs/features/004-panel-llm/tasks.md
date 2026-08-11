# 004 · Panel LLM base — Tasks

Estado: completado. Marcar `[ ]` pendiente y `[x]` al completar.

## T1 · BFF endpoints

- [x] Crear `src/app/api/bff/llm/classify/route.ts` con fetch a FastAPI + auth header + error mapping.
- [x] Crear `src/app/api/bff/llm/summarize/route.ts` idéntico pattern.
- [x] Crear `src/app/api/bff/llm/chat/route.ts` idéntico pattern.
- [x] Verificar tipos de respuesta FastAPI y mapear a `ApiError` local.

## T2 · Tipos y hooks

- [x] Crear `src/types/llm.types.ts` con `LlmClassifyInput/Output`, `LlmSummarizeInput/Output`, `LlmChatInput/Output`.
- [x] Crear hook `src/hooks/llm/useLlm.ts` con TanStack Query keys por tenant y mutaciones `useLlmClassify`, `useLlmSummarize`, `useLlmChat`.
- [x] Configurar query keys: `['tenant', tenantId, 'llm', 'classify']`, etc.

## T3 · Panel lateral UI

- [x] Crear `src/components/llm/LlmSidebar.tsx` con 3 pestañas: Clasificar, Resumir, Chat.
- [x] Cada pestaña tiene input text, botón enviar, disclaimer humano badge, botón Descartar.
- [x] Estados: loading (skeleton), error (mensaje + reintentar), vacío.
- [x] Filtros de PII: truncado a 3000 chars, máscaras básicas en input.

## T4 · Integración y cierre

- [ ] `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde (0 errores, 0 warnings).
- [ ] Prueba contra FastAPI real con usuario con tenant: panel visible, pestañas funcionan, logging creado.
- [ ] Verificar disclaimer aparece en cada salida y botón Descartar limpia el estado.
- [ ] Verificar a11y: labels aria, contraste AA, focus management en tabs.
- [ ] Documentar en `ia-docs/init/changes.md` y actualizar `arquitecture.md` (nuevos endpoints y panel).
- [ ] Mover 004 a "Hecho" en `ia-docs/constitution/roadmap.md`.