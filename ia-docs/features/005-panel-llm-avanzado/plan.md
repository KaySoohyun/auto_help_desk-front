# 005 · Panel LLM avanzado — Plan

## Enfoque

Extender el panel LLM base (004) respetando `arquitecture.md`, `conventions.md` y los contratos reales de `ia-docs/backend/api.md`. Panel con streaming SSE, sugerencias predictivas, feedback loop y PII filtering. Todo el contenido visible en español; tipos en `src/types/`; server state con TanStack Query; disclaimer humano y logging auditado.

## Decisiones técnicas

| Decisión | Detalle |
| --- | --- |
| **Ruta** | Panel lateral en `/app` (mismo sidebar que 004). Nueva pestaña "Sugerencias" y "Streaming". |
| **Endpoints BFF** | `POST /api/bff/llm/stream`, `POST /api/bff/llm/suggest`, `POST /api/bff/llm/feedback`. |
| **Validación** | Zod schemas para cada endpoint. Filtro PII pre-send. |
| **Query Keys** | TanStack Query keys: `['tenant', tenantId, 'llm', 'stream']`, etc. |
| **Estados** | streaming: loading incremental, error, conectado, desconectado. |
| **Disclaimer humano** | Mantener badge de 004 en todas las salidas. |
| **Logging** | Cada acción de feedback guarda: usuario, ticket, acción, timestamp, score de confianza. |
| **a11y** | keyboard navigation entre tabs, labels aria en todos los controles, foco visible. |

## Pasos de implementación

1. **BFF endpoints**: crear `src/app/api/bff/llm/{stream,suggest,feedback}/route.ts` con fetch a FastAPI + auth + SSE handling.
2. **Tipos**: `src/types/llm.types.ts` extender tipos existentes con `LlmStreamInput`, `LlmSuggestInput`, `LlmFeedbackInput`.
3. **Hooks TanStack Query**: `src/hooks/llm/useLlm.ts` agregar mutaciones `useLlmStream`, `useLlmSuggest`, `useLlmFeedback`.
4. **Panel lateral UI**: `src/components/llm/LlmSidebar.tsx` - agregar pestaña **Sugerencias** y **Streaming**.
5. **Estados de streaming**: handling de conexión SSE, reconexión automática, indicador de "usuario desconectado".
6. **Validación PII**: filter y mask de datos sensibles antes de enviar al LLM.
7. **Integración y cierre**: `pnpm build`, `pnpm lint`, `pnpm typecheck` + prueba contra FastAPI real.
8. **Documentar** en `changes.md` y actualizar `roadmap.md`.

## Validación

- `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde.
- Probar contra FastAPI real: panel visible, streaming en tiempo real, sugerencias basadas en ticket.
- Verificar feedback se guarda en backend.
- a11y: keyboard navigation, contraste, labels.