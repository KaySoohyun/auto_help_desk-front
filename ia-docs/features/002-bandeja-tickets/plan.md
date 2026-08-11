# 002 · Bandeja y detalle de tickets — Plan

## Enfoque

Construir la operación de tickets sobre la base de 001, respetando `arquitecture.md`, `conventions.md` y los contratos reales de `ia-docs/backend/api.md`. Todo el contenido visible en español; tipos en `src/types/`; server state con TanStack Query; selección en Zustand; filtros y paginación en la URL; el navegador solo habla con el BFF.

## Decisiones técnicas

| Decisión | Detalle |
| --- | --- |
| Rutas | `/app/tickets` (bandeja) y `/app/tickets/[ticketId]` (detalle). Dentro del layout `/app` existente. |
| Tipos | `src/types/ticket.types.ts`: `TicketStatus`, `TicketPriority`, `TicketSummary`, `Ticket`, `TicketList`, `TicketMessage`, `TicketListQuery`, `TicketUpdatePayload`. |
| BFF | Route Handlers: `GET /api/bff/tickets`, `POST /api/bff/tickets`, `GET /api/bff/tickets/[ticketId]`, `GET+POST .../messages`, `PATCH .../[ticketId]`, `POST .../close`. Reusan `fastApiFetch` + refresh automático. |
| Query | TanStack Query con keys por tenant: `['tenant', tenantId, 'tickets', filters]`. `useTickets`, `useTicket`, `useMessages`, mutaciones `useSendMessage`, `useUpdateTicket`, `useCloseTicket`, `useCreateTicket`. |
| Filtros en URL | searchParams parseados con Zod: `status`, `priority`, `category`, `page` (→ offset). Cambios navegan con `router.push`. |
| Paginación | `limit` fijo (50 por defecto), `offset = (page-1)*limit`, `total` del backend. |
| Selección | `src/stores/ticket-selection.store.ts` (Zustand): set de ids, toggle, clear, contador. Solo UI; sin bulk. |
| Búsqueda | Client-side por subject con debounce (~300ms), sobre la página cargada. |
| Composer | RHF + Zod (body 1–5000 chars). Enviar → mutation → invalidar `useMessages` y `useTickets`. |
| Acciones | Select de estado/prioridad (PATCH), asignar (PATCH `assignee_id`), cerrar con confirmación (dialog). Visibilidad según rol (agent: `responses:edit`/`responses:send`). |
| Alto de ticket | RHF + Zod (subject 1–200, description 1–4000, category ≤100, priority). Dialog desde la bandeja. |
| Errores | `ApiError` con traducción a español: 403 sin tenant, 404 otro tenant, 422 validación, 401 refresh fallido. |
| Seguridad | Subject, description y mensajes como texto plano; sin `dangerouslySetInnerHTML`. |
| a11y | Labels/aria en filtros y acciones, skeleton loading, jerarquía de headings, focus tras cerrar dialogs. |
| Componentes | `features/tickets/`: `TicketsTable`, `TicketsFilters`, `TicketRow`, `TicketBadges`, `TicketsPagination`, `TicketDetail`, `TicketThread`, `MessageItem`, `MessageComposer`, `TicketActions`, `CreateTicketDialog`, `StatusSelect`, `PrioritySelect`, `AssigneeSelect`. |

## Pasos de implementación

1. Tipos: `src/types/ticket.types.ts`.
2. BFF: `GET/POST /api/bff/tickets`, `GET /api/bff/tickets/[ticketId]`, `GET/POST .../messages`, `PATCH`, `close`.
3. Store de selección: `src/stores/ticket-selection.store.ts`.
4. Hooks de query/mutación: `src/hooks/tickets/`.
5. Bandeja `/app/tickets`: filtros (URL), tabla, badges, paginación, búsqueda client-side, selección.
6. Detalle `/app/tickets/[ticketId]`: metadata, thread, composer, acciones (estado/prioridad/asignación/cerrar).
7. Alta de ticket: `CreateTicketDialog` en la bandeja.
8. Estados loading/error/empty en bandeja y detalle.
9. Validación de permisos en UI según rol de sesión.
10. Cierre: `pnpm build`, `pnpm lint`, `pnpm typecheck` + prueba contra FastAPI real + docs (`changes.md`, roadmap).

## Validación

- `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde.
- Probar contra FastAPI local con un usuario con tenant: listar, filtrar, paginar, abrir detalle, responder, cambiar estado, asignar, cerrar, crear ticket.
- Verificar que filtros persisten en la URL y la selección se mantiene al navegar.
