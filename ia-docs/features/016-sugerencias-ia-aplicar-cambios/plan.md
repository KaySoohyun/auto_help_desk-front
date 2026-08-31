# Plan: Sugerencias IA — Aplicar cambios (feature 016)

Feature **016** (`ia-docs/features/016-sugerencias-ia-aplicar-cambios/`).

## Enfoque
Rehacer la sección de sugerencias del panel IA (Clasificación + Resumen) para que sean datos **aplicables al ticket real**, persistidos y consumidos al re-entrar, con eliminación de `subcategory/intent/rationale` y un bloqueo de salida suave.

Afecta **frontend y backend** (a diferencia de 015 que era solo frontend).

## Orden de trabajo (de menor a mayor riesgo)
1. **Contrato/backend**: ajustar servicios y contractos de clasificación (quitar subcategory/intent/rationale del output persistido) y de persistencia de resumen. Asegurar `GET /suggestions` devuelve lo necesario y que `output` refleja el valor aplicado.
2. **Tipos frontend**: actualizar `llm.types.ts` (clasificación sin subcategory/intent/rationale; tipos de suggestion cargada con `state` y `output`).
3. **Hook de carga**: consumir `GET /suggestions` al entrar (en vez de auto-analyze).
4. **UI de sugerencias**: sección unificada con Categoría/Prioridad/Resumen y controles Aplicar/Editar/Regenerar.
5. **Aplicar cambios**: conectar a `useUpdateTicket` (category+priority) y feedback con `accepted`/`edited`.
6. **Regla de visibilidad**: clasificación oculta si resuelta; resumen siempre visible.
7. **Bloqueo de salida suave**: banner de pendientes + confirmación.
8. **Validación y cierre**.

## Decisiones técnicas
- **El ticket real no tiene campo de resumen** → el resumen se persiste en `ai_suggestions.output` (sugerencia) no en el ticket.
- **Aplicar clasificación** → `PATCH /tickets/{id}` con `{ category, priority }` (persistido en el ticket) + feedback `accepted`.
- **Aplicar/editar resumen** → persiste el nuevo resumen en el output de la sugerencia + feedback `edited` (si cambió) o `accepted` (si igual).
- **Carga al re-entrar** → `GET /v1/ai/tickets/{id}/suggestions` devuelve las sugerencias con `type`, `state` y `output`; el frontend las mapea a la UI. No se llama `analyze` automáticamente.
- **Regenerar** → `POST .../classify` o `POST .../summary` crea nueva sugerencia draft; se reemplaza la pendiente.
- **Solo stack existente**; sin dependencias nuevas.
- Backend: ver `backend-python/ia-docs/` para registrar cambios (`cambios.md`).

## Archivos a tocar (tentativos, se confirman al implementar)
Frontend:
- `src/types/llm.types.ts` — clasificación sin subcategory/intent/rationale; tipo de suggestion cargada.
- `src/components/llm/LlmAssistantPanel.tsx` — sección de sugerencias unificada + aplicar/editar/regenerar + visibilidad.
- Nuevo hook frontend para `GET /suggestions` (o extender `useLlm`).
- `src/hooks/tickets/useUpdateTicket.ts` — ya soporta category/priority.
- Banner de pendientes + confirmación de salida (en `TicketDetailView` o el panel).
Backend:
- `app/services/classifier.py` — `_parse_output`/output sin subcategory (quitar subcategory/intent/rationale del output persistido o dejar category+priority).
- `app/services/analyze.py`, `app/schemas/ai.py` (ClassificationOut/SuggestionOut) — reflejar el nuevo shape.
- Persistencia de resumen aplicado/editado.

## Validación
- Backend: `.venv/bin/python -m pytest -q` en verde.
- Frontend: `pnpm lint` (sin warnings) y `pnpm typecheck`.
- Verificación manual como agente en `/acme-corp/app/tickets/11`.
- Documentar en `frontend-nextjs/ia-docs/init/changes.md` y backend `cambios.md`; mover la feature a "Hecho" en `roadmap.md`.
