# 004 · Panel LLM base — Plan

## Enfoque

Construir el panel LLM base sobre la base de 001, 002 y 003, respetando `arquitecture.md`, `conventions.md` y los contratos reales de `ia-docs/backend/api.md`. Todo el contenido visible en español; tipos en `src/types/`; server state con TanStack Query; panels modales y lateral; disclaimer humano y logging auditado.

## Decisiones técnicas

| Decisión | Detalle |
| --- | --- |
| **Ruta** | Panel lateral en `/app` (izquierda, debajo de Sidebar). Accesible desde cualquier página del app. |
| **Pestañas** | 3 pestañas: Clasificar, Resumir, Chat. Navegación por tabs client-side. |
| **Endpoints BFF** | `POST /api/bff/llm/classify`, `POST /api/bff/llm/summarize`, `POST /api/bff/llm/chat`. |
| **Validación** | Zod schemas para cada endpoint: input text obligatorio, truncado a 3000 chars, disclaimer toggle. |
| **Query Keys** | TanStack Query keys por tenant: `['tenant', tenantId, 'llm', action, params]`. |
| **Estados** | loading (skeleton), error (mensaje + reintentar), vacío (sin input). |
| **Disclaimer humano** | Badge obligatorio "Salida generada por IA. Verificar antes de usar." con botón Descartar. |
| **Logging** | Cada llamada LLM guarda: usuario, tenant, input hash, output truncado, timestamp, éxito/fallo. |
| **Seguridad** | Sin enviar PII al LLM (truncado + máscara). El backend es la autoridad de validación. |
| **a11y** | labels aria en todos los inputs, contraste AA, foco visible al navegar tabs, esc para cerrar modals. |

## Pasos de implementación

1. **BFF endpoints**: crear `src/app/api/bff/llm/{classify,summarize,chat}/route.ts` con fetch a FastAPI + auth header + error mapping.
2. **Tipos**: `src/types/llm.types.ts` con `LlmClassifyInput`, `LlmClassifyOutput`, `LlmSummarizeInput`, `LlmSummarizeOutput`, `LlmChatInput`, `LlmChatOutput`.
3. **Hooks TanStack Query**: `src/hooks/llm/useLlw.ts` con keys por tenant y mutaciones `useLlmClassify`, `useLlmSummarize`, `useLlmChat`.
4. **Panel lateral**: `src/components/llm/LlmSidebar.tsx` con 3 pestañas y disclaimer.
5. **Estados y UI**: loading (skeleton cards), error state, vacío state, disclaimer badge.
6. **Integración y cierre**: `pnpm build`, `pnpm lint`, `pnpm typecheck` + prueba contra FastAPI real + verificación de logs.
7. **Documentar** en `changes.md` y actualizar `roadmap.md`.

## Validación

- `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde.
- Probar contra FastAPI real con usuario con tenant: panel visible, pestañas funcionan, logging creado.
- Verificar disclaimer aparece en cada salida y botón Descartar limpia el estado.
- a11y básico: labels, contraste, focus management.