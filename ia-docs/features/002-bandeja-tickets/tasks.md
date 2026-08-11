# 002 · Bandeja y detalle de tickets — Tasks

Estado: pendiente. Marcar `[x]` al completar.

## T1 · Tipos y BFF

- [x] `src/types/ticket.types.ts`: `TicketStatus`, `TicketPriority`, `TicketSummary`, `Ticket`, `TicketList`, `TicketMessage`, `TicketListQuery`, `TicketUpdatePayload`, `CreateTicketPayload`.
- [x] `GET /api/bff/tickets`: lista con query params (status, category, priority, assignee_id, date_from, date_to, limit, offset) y traducción de errores.
- [x] `POST /api/bff/tickets`: crea ticket.
- [x] `GET /api/bff/tickets/[ticketId]`: detalle con `description`.
- [x] `GET /api/bff/tickets/[ticketId]/messages`: lista mensajes asc.
- [x] `POST /api/bff/tickets/[ticketId]/messages`: agrega mensaje.
- [x] `PATCH /api/bff/tickets/[ticketId]`: actualiza status/priority/category/assignee_id.
- [x] `POST /api/bff/tickets/[ticketId]/close`: cierra ticket.

## T2 · Estado y hooks

- [x] `src/stores/ticket-selection.store.ts`: set de ids, toggle, clear, contador, bulk-ready.
- [x] `src/hooks/tickets/useTickets.ts`: query con filtros (TanStack Query, key por tenant).
- [x] `src/hooks/tickets/useTicket.ts` y `useMessages.ts`: detalle y mensajes.
- [x] `src/hooks/tickets/useSendMessage.ts`, `useUpdateTicket.ts`, `useCloseTicket.ts`, `useCreateTicket.ts`: mutaciones con invalidación.

## T3 · Bandeja `/app/tickets`

- [x] `TicketsFilters`: status, priority, category desde URL (searchParams con Zod); cambios navegan.
- [x] `TicketsTable` + `TicketRow`: subject, badges estado/prioridad, categoría, asignado, antigüedad.
- [x] `TicketsPagination`: offset/total, prev/next, respeta URL.
- [x] Búsqueda client-side por subject con debounce.
- [x] Checkbox de selección múltiple → `ticket-selection.store`.
- [x] Estados loading (skeleton), error y empty.
- [x] `CreateTicketDialog`: subject, description, category, priority (RHF + Zod).

## T4 · Detalle `/app/tickets/[ticketId]`

- [x] `TicketDetail`: metadata (estado, prioridad, categoría, idioma, asignado, fechas) + subject/description.
- [x] `TicketThread` + `MessageItem`: mensajes asc, autor, fecha; texto plano.
- [x] `MessageComposer`: RHF + Zod, enviar → invalidar mensajes y lista.
- [x] `TicketActions`: cambiar estado (PATCH), cambiar prioridad (PATCH), asignar (PATCH assignee_id), cerrar (dialog de confirmación).
- [x] Visibilidad de acciones según rol (agent con `responses:edit`/`responses:send`).
- [x] Estados loading, error y empty.

## T5 · Cierre

- [ ] `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde.
- [ ] Prueba contra FastAPI real con usuario con tenant: listar, filtrar, paginar, detalle, responder, cambiar estado, asignar, cerrar, crear.
- [ ] Documentar en `ia-docs/init/changes.md` y actualizar `arquitecture.md` (rutas/componentes nuevos).
- [ ] Mover 002 a "Hecho" en `ia-docs/constitution/roadmap.md`.
