# 002 · Bandeja y detalle de tickets

**Estado:** propuesta

## Qué hace

Implementa la operación central de la etapa 1.2 de la Fase 1: listar tickets del tenant con filtros, paginación y selección; ver el detalle de un ticket con su conversation thread y metadata; y responder con mensajes públicos, además de acciones básicas de estado/prioridad/asignación. Sin LLM.

## Por qué

Sin bandeja y detalle no hay operación de soporte real. Esta etapa convierte la base de la 001 en una herramienta de trabajo: el agente ve qué le toca, abre tickets, lee la conversación y responde. Es el corazón del MVP (Fase 1 del `plan.md`).

## Contexto real del backend (contratos de `ia-docs/backend/api.md`)

- `GET /v1/tickets` → `TicketListOut` (`items`, `total`, `limit`, `offset`). Filtros por query params: `status`, `category`, `priority`, `assignee_id`, `date_from`, `date_to`, `limit` (1–200, default 50), `offset`. Orden: `created_at` desc. **No** incluye `description`.
- `GET /v1/tickets/{ticket_id}` → `TicketOut` (con `description` descifrada).
- `GET /v1/tickets/{ticket_id}/messages` → `[TicketMessageOut]` (orden `created_at` asc).
- `POST /v1/tickets/{ticket_id}/messages` → agrega mensaje (`author_id` del autenticado). Permiso `responses:edit`.
- `PATCH /v1/tickets/{ticket_id}` → `status | priority | category | assignee_id`. Permiso `responses:edit` o `responses:send`.
- `POST /v1/tickets/{ticket_id}/close` → cierra el ticket. Permiso `responses:send`.
- `POST /v1/tickets` → crea un ticket (estado inicial `open`).
- `GET /v1/workspace/my-tickets` → bandeja del agente (solo asignados a él).
- Errores: 403 si rol sin tenant ("Rol sin tenant asignado"), 404 si ticket inexistente o de otro tenant, 401 por token.

### Notas importantes del modelo (`ia-docs/backend/models.md`)

- `subject`, `description` y `body` de mensajes están **cifrados en reposo**; la API los devuelve descifrados. Tratarlos como contenido del cliente (no confiable): sin `dangerouslySetInnerHTML`, render como texto plano.
- Los mensajes **no tienen flag público/interno**: son todos públicos. No existe nota interna en la API.
- No hay adjuntos en el modelo.
- No hay endpoint de "historia de eventos" por ticket en esta API.

## Decisiones de adaptación (a aprobar)

1. **Búsqueda de texto**: `GET /v1/tickets` no tiene param de búsqueda full-text. Se implementa **filtro por texto client-side** sobre la página cargada (subject). Queda documentado que es limitado a la página actual; búsqueda server-side se evalúa cuando el backend la exponga.
2. **SLA**: el modelo no tiene campos de SLA. Se muestra **prioridad y antigüedad** como indicadores, sin countdowns de SLA.
3. **Notas internas**: fuera de alcance (la API no las soporta). Todo mensaje enviado es público. Se documenta como decisión; cuando el backend agregue `internal` se habilita la nota interna.
4. **Adjuntos**: fuera de alcance (no hay endpoints). Si aparece un `attachments` en el modelo futuro, se agrega "en solo vista".
5. **Historia de eventos**: se muestra un resumen mínimo (fechas de creación/actualización) sin timeline de auditoría por ticket.
6. **Selección múltiple**: se implementa el **estado de selección** (Zustand) y UI de checkboxes, pero **sin bulk actions** todavía (el backend no tiene endpoints batch). La selección queda lista para la etapa de bulk actions.
7. **Crear ticket**: se incluye `POST /v1/tickets` con un formulario simple (subject, description, category, priority) en la bandeja. No es bulk ni panel LLM: es el alta manual de ticket.
8. **Rutas**: bajo `/app/tickets` (sin tenantSlug, consistente con 001): `/app/tickets` (bandeja) y `/app/tickets/[ticketId]` (detalle).

## Criterios de aceptación

- [ ] `/app/tickets` lista tickets del tenant con estados de loading (skeleton), error y empty.
- [ ] Filtros por `status`, `priority`, `category` y página viven en la URL (searchParams) y se parsean con Zod.
- [ ] Paginación con `limit`/`offset`, respetando `total` del backend; prefetch de página siguiente opcional.
- [ ] La tabla muestra: subject, estado, prioridad, categoría, asignado, antigüedad. Badges de estado/prioridad con tokens de `colors.md`.
- [ ] Checkbox de selección múltiple persiste en `ticket-selection.store.ts`; sin bulk actions.
- [ ] Texto de búsqueda client-side (debounce) filtra la página cargada por subject.
- [ ] `/app/tickets/[ticketId]` muestra metadata (estado, prioridad, categoría, idioma, asignado, fechas) y el conversation thread (mensajes asc, autor, fecha).
- [ ] Composer para responder: valida con Zod, envía `POST messages`, invalida queries y muestra el nuevo mensaje sin recargar.
- [ ] Acciones: cambiar estado/prioridad (`PATCH`), asignarse o asignar a otro (`assignee_id`), cerrar ticket (`POST close`) con confirmación. Botones según permiso del rol.
- [ ] Formulario de alta de ticket (subject, description, category, priority) con validación y error inline.
- [ ] Solo el BFF llama a FastAPI; el navegador usa `/api/bff/...`.
- [ ] `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde.
- [ ] Contenido visible en español; errores traducidos a español.
- [ ] Errores de la API se traducen a mensajes amigables (403 sin tenant, 404 otro tenant, 422 validación).
- [ ] Sin `dangerouslySetInnerHTML`; subject, description y mensajes renderizados como texto.
- [ ] a11y: labels/aria en filtros y acciones, jerarquía de headings, contraste AA.

## Fuera de alcance

- LLM (classify/summary/reply, panel lateral) → Fase 2.
- Bulk actions (cerrar/asignar en lote), optimistic updates complejas.
- Notas internas y adjuntos (el backend no los soporta).
- Timeline de auditoría por ticket.
- Realtime/websockets para mensajes (polling o refetch manual).
- Vistas guardadas / filtros custom.
- Búsqueda server-side (se evalúa cuando la API la exponga).

## Datos de prueba

- Se necesita un usuario con `tenant_id` asignado (los admins del `.env` no tienen tenant y los endpoints de tickets devuelven 403). Verificar con `GET /auth/me` y `GET /v1/tickets`.
- Crear 2–3 tickets de prueba vía `POST /v1/tickets` y agregar mensajes para probar thread y filtros.
