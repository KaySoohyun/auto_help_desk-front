# 007 · Base de conocimiento — Plan

**Objetivo:** dar al tenant una base de conocimiento operativa (listado + filtros, editor con draft/published/archived, versionado por snapshot y permisos por rol) e integrarla con tickets/LLM (artículos relacionados + insertar referencia). El backend no tiene endpoints KB: se definen los contratos en esta feature y se documentan como pendientes de FastAPI.

## Enfoque

1. **Contratos primero:** tipos en `src/types/knowledge.types.ts` + rutas BFF `/api/bff/knowledge/*` que proxean a `/v1/kb/*`. Mismo patrón que tickets (`authenticatedFetch`, Zod en el Route Handler, errores BFF tipados).
2. **Hooks TanStack Query** en `src/hooks/knowledge/` (keys con tenant) + mutaciones con invalidación.
3. **UI en `/app/knowledge/*`**: listado con filtros en URL y búsqueda client-side; detalle; editor (RHF + Zod); historial de versiones; taxonomy view de categorías.
4. **Permisos UI** en `src/lib/permissions.ts` (`kb:read`/`kb:edit`/`kb:publish`); agente solo lectura de publicados.
5. **Integración 3.4** en `LlmAssistantPanel`: artículos relacionados por categoría/tags + "Insertar referencia" → composer vía `onUseReply`.
6. **Cierre:** documentar contratos pendientes en `backend/api.md` y `models.md`; actualizar `changes.md`, `arquitecture.md` y `roadmap.md`.

## Fuentes

- Spec de esta feature (`spec.md`).
- Fase 3 de `ia-docs/init/plan.md` (3.1 listado/búsqueda, 3.2 editor/versionado, 3.3 permisos/workflow, 3.4 integración tickets/LLM).
- Permisos de KB en `ia-docs/init/spec.md` § 4.2 ("Gestionar KB borradores 🔶/✅", "Publicar KB ❌/✅").
- `conventions.md` (BFF, query keys con tenant, filtros en URL, a11y, sin `dangerouslySetInnerHTML`).
- Patrón existente de bandeja de tickets (002) y panel LLM (004–006).

## Riesgos / supuestos

- **Backend sin KB**: los BFF apuntan a `/v1/kb/*` que FastAPI no expone hoy. El código compila y se prueba con respuestas simuladas; la validación funcional real queda pendiente y documentada. No se degradan las features existentes (el router solo agrega rutas nuevas).
- **Categorías/tags planos**: si el backend futuro los modela como entidades, el contrato puede evolucionar; el frontend consume strings (`category`, `tags[]`) que son el mínimo común.
- **Sin markdown**: el editor es texto plano. Si se pide rich text luego, implica nueva dependencia → decisión separada.

## Orden de implementación

1. T1 — Tipos + contratos BFF (`/v1/kb` documentado en spec, rutas `/api/bff/knowledge/*`).
2. T2 — Hooks TanStack Query + query keys.
3. T3 — Listado, filtros y búsqueda + activar nav del Sidebar.
4. T4 — Detalle, editor (crear/editar) y transiciones de estado con confirmaciones + versionado.
5. T5 — Permisos UI + taxonomy view de categorías.
6. T6 — Integración con tickets/LLM (artículos relacionados + insertar referencia).
7. T7 — Cierre: build/lint/typecheck, docs (backend/api.md, models.md, changes.md, arquitecture.md, roadmap).

## Criterios de aceptación

Ver `spec.md`. Resumen: listado con filtros y estados, agente solo lectura de publicados, supervisor+ gestiona y publica, versionado por snapshot visible, panel LLM con artículos relacionados e insertar referencia, contratos documentados como pendientes, build/lint/typecheck en verde, sin `dangerouslySetInnerHTML`.
