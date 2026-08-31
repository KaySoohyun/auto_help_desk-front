# Plan: Correcciones del detalle de ticket (lado agente)

Feature **015** (`ia-docs/features/015-correcciones-detalle-ticket-agente/`).

## Enfoque
Todo el trabajo es **frontend** (`frontend-nextjs`), en la vista de detalle de ticket del agente y en la navegación interna. No se toca el backend FastAPI ni el modelo de datos (el punto 1 es solo una duda, se descarta como bug).

Se sigue el orden de menor a mayor riesgo para desbloquear la navegación primero y luego iterar sobre la UI:
1. Puntos 5 y 6 (fix de rutas con slug) — pequeño, alto impacto, desbloquea navegación.
2. Punto 3 (header superior) — reestructura el encabezado.
3. Punto 2 (Propiedades con selects) — reutiliza lógica existente del chat.
4. Punto 4 (panel "Asistente IA" simplificado).

## Decisiones técnicas
- **Slug disponible** en server components vía `params` (`{ tenantSlug }`); en client components vía `useParams()`/hook de tenant existente.
- **Propiedades**: se reutilizan `useUpdateTicket`, `STATUS_LABELS`, `PRIORITY_LABELS` y la lógica de asignación actual (`toggleAssignment`) que ya usa `TicketDetailView`.
- **Header**: se mueve el bloque actual (id/estado/descripción + acciones) fuera del grid central. El botón "Cerrar ticket" reutiliza `useCloseTicket` con el `AlertDialog` de confirmación de `TicketActions`.
- **Panel IA**: consumir sugerencias persistidas (`GET /v1/ai/tickets/{id}/suggestions` — ya existe en backend) para pre-completar clasificación/resumen/respuesta; los botones Regenerar/Editar/Usar como respuesta se conectan a los endpoints IA existentes.
- **No añadir dependencias** nuevas; solo usar el stack existente.

## Archivos a tocar (tentativos, se confirman al implementar)
- `src/components/features/tickets/TicketDetailView.tsx` — header superior + grid.
- `src/components/features/tickets/TicketPropertiesCard.tsx` — selects editables.
- `src/components/features/tickets/TicketActions.tsx` — quitar selects de Estado/Prioridad del chat.
- `src/components/llm/LlmAssistantPanel.tsx` — renombrado + simplificación.
- `src/app/[slug]/app/tickets/[ticketId]/page.tsx` — "Volver a tickets" con slug.
- `src/app/[slug]/app/knowledge/page.tsx`, `app/page.tsx`, `admin/page.tsx`, `knowledge/categories/page.tsx`, `knowledge/articles/[articleId]/page.tsx`, `knowledge/articles/new/page.tsx` — redirects/backlinks con slug.
- `src/components/features/audit/AuditEventsView.tsx` — `router.push` con slug.

## Validación
- `pnpm lint` (sin warnings) y `pnpm typecheck`.
- Verificación manual contra `localhost:3000` como agente en `/acme-corp/app/tickets/11`.
- Documentación: registrar en `ia-docs/init/changes.md` y mover la feature a "Hecho" en `constitution/roadmap.md`.
