# Tasks: Sugerencias IA — Aplicar cambios (feature 016)

Feature **016** — implementar de a una, actualizando el estado aquí. Esperar OK del usuario antes de tocar código.

## Backend (contratos y servicios)
- [x] T1 · `classifier.py`: quitar `subcategory`, `intent`, `rationale` del output persistido de la sugerencia de clasificación (dejar `category`, `suggested_priority`, + metadatos)
- [x] T2 · `schemas/ai.py`: actualizar `ClassificationOut` y `SuggestionOut` al nuevo shape (sin subcategory/intent/rationale); reflejar `state`/`output` en `GET /suggestions`
- [x] T3 · `analyze.py`: coherente con el nuevo shape de clasificación
- [x] T4 · Persistencia del resumen aplicado/editado en `output` de la sugerencia (state `accepted`/`edited`) — `FeedbackIn.edited_output` + `FeedbackService` lo aplica a `suggestion.output`
- [x] T5 · Tests backend del nuevo flujo en verde (`pytest` 302 passed)

## Frontend — tipos y carga
- [ ] T6 · `llm.types.ts`: clasificación sin subcategory/intent/rationale; tipo de `SuggestionOut` cargado con `state` y `output`
- [ ] T7 · Consumir `GET /suggestions` al re-entrar (nuevo hook o extensión de `useLlm`); no auto-analyze

## Frontend — UI de sugerencias
- [ ] T8 · Sección "Sugerencias" unificada con Categoría, Prioridad y Resumen (sin subcategory/intent/rationale)
- [ ] T9 · Controles por dato: menú kebab con **Aplicar cambios · Editar · Regenerar** (reusa `DropdownMenu`)
- [ ] T9.1 · Botón "Aplicar cambios" como **icon button al lado del kebab**; visible **solo mientras hay cambios sin guardar** (se oculta al aplicarse/guardarse)

## Frontend — aplicar cambios
- [ ] T10 · "Aplicar cambios" (clasificación) → `useUpdateTicket` `{category, priority}` + feedback `accepted`
- [ ] T11 · Persistir resumen aplicado/editado → feedback `accepted`/`edited` y estado local guardado

## Frontend — visibilidad y bloqueo
- [ ] T12 · Regla de visibilidad: clasificación oculta si resuelta; resumen siempre visible (lectura si resuelto)
- [ ] T13 · Banner/indicador de pendientes + confirmación de salida (Clasificación + Resumen)

## Cierre
- [ ] T14 · `pnpm lint` sin warnings y `pnpm typecheck` OK
- [ ] T15 · Verificación manual como agente en `/acme-corp/app/tickets/11` (aplicar cambios, persistencia, re-entrada, bloqueo)
- [ ] T16 · Documentar en `changes.md` (frontend + backend) y mover a "Hecho" en `roadmap.md`
