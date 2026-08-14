# 013 · Portal de personas — Tasks

**Estado:** completado

## Backend (`backend-python`, feature 021)

- [x] T1. Rol `customer` en `UserRole` + `PUBLIC_REGISTRATION_ROLES` + permiso `persona:tickets` en `ROLE_PERMISSIONS`.
- [x] T2. Migración: columna `customers.user_id` (FK users.id, nullable, unique) + script idempotente (`scripts/migrate_customers_user_id.py`).
- [x] T3. `/auth/register`: si rol es `customer`, crear fila `Customer` (name/email, tenant, user_id) y devolverla.
- [x] T4. `GET /v1/me/tickets` (mis tickets, filtros, paginación, scope tenants, aislamiento por customer).
- [x] T5. `POST /v1/me/tickets` (crear ticket del cliente con customer_id).
- [x] T6. `GET /v1/me/tickets/{id}` (detalle aislado por customer).
- [x] T7. `GET|POST /v1/me/tickets/{id}/messages` (thread + enviar mensaje; sin LLM). + `GET /v1/me` (perfil: nombre, empresa, tenant).
- [x] T8. `tests/test_persona_portal.py` (registro, mis tickets, aislamiento, crear, mensajes).

## Frontend (`frontend-nextjs`)

- [x] T10. Tipos (`UserRole.customer`, `TicketSummary.customer_id`, `PersonaProfile`) + labels ES reutilizados (`STATUS_LABELS`/`PRIORITY_LABELS`) + `ROLE_LABELS.customer` + maps de permisos.
- [x] T11. BFF `/api/bff/me/tickets*` (list/create/detail/messages) + `/api/bff/me/profile` + registro acepta `role` (`agent` | `customer`).
- [x] T12. `/personas/login` (login + registro customer con selección de tenant) + ruteo post-login por rol (`homePathForRole`: customer → `/panel`).
- [x] T13. Grupo `(personas)` + `PersonaShell`/`PersonaHeader` (sin sidebar) + proxy (`/panel/*` protegido; `/personas/login` redirige por rol vía JWT).
- [x] T14. Hooks TanStack Query de persona (`useMyTickets`, `useMyTicket`, `useMyMessages`, `useSendMyMessage`, `useCreateMyTicket`, `useMyProfile`).
- [x] T15. `/panel`: `PersonasDashboard` (saludo, buscador, filtros con conteos, lista, empty state, modal crear ticket).
- [x] T16. `/panel/tickets/[id]`: `PersonaTicketDetail` (header, descripción, thread con emisor derivado, composer, panel lateral). Sin LLM.
- [x] T17. `tests/persona-flow.test.ts` (registro customer, mis tickets, crear, mensaje, aislamiento).

## Verificación

- [x] T18. pytest backend en verde (**293 passed**); `pnpm typecheck`, `lint`, `build` en verde; `test:functional` en verde (**115 tests**).
- [x] T19. Documentar en `changes.md` / `cambios.md` y actualizar roadmaps.
