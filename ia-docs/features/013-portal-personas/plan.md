# 013 · Portal de personas — Plan

**Estado:** propuesto (a aprobar)

## Objetivo

Entregar el portal de usuario final (personas): dashboard con mis tickets + detalle con conversación y auto-respuesta IA, con soporte backend completo (rol `customer`).

## Alcance por capa

### Backend (repositorio `backend-python`, feature 021)

1. **Modelo**: agregar rol `customer` a `UserRole`; columna `customers.user_id` (FK users.id, nullable, unique) + migración idempotente.
2. **Permisos**: `persona:tickets` otorgado solo a `customer` en `ROLE_PERMISSIONS`.
3. **Auth**: agregar `customer` a `PUBLIC_REGISTRATION_ROLES`; en `/auth/register`, si rol es `customer`, crear la fila `Customer` (name/email, tenant, `user_id`).
4. **Endpoints `/v1/me/tickets*`** (requieren permiso `persona:tickets`):
   - `GET /v1/me/tickets` — mis tickets (customer_id del usuario, scope tenants, filtros status/category/priority/search?limit/offset).
   - `POST /v1/me/tickets` — crear ticket (subject, description, category, priority) → setea customer_id.
   - `GET /v1/me/tickets/{id}` — detalle (aislado por customer).
   - `GET /v1/me/tickets/{id}/messages` — thread.
   - `POST /v1/me/tickets/{id}/messages` — enviar mensaje (author_id = cliente). Sin LLM/auto-respuesta.
5. **Tests pytest**: `tests/test_persona_portal.py` (registro customer, mis tickets + aislamiento cross-customer/tenant, crear, mensajes).

### Frontend (repositorio `frontend-nextjs`, feature 013)

6. **Tipos**: `PersonaTicket` (reusa `Ticket` + `customer`), labels ES de estados/prioridades (`ticketStatusLabels`/`ticketPriorityLabels`).
7. **BFF** (`/api/bff/me/tickets*`): list, create, detail, messages (GET/POST), auto-reply. Registrar acepta `role`.
8. **Auth**: `/personas/login` (login + registro con selección de tenant); post-login rota a `/panel` si rol `customer`. Store: `SessionUser.role` ya existe.
9. **Layout persona** (grupo `(personas)`): `PersonaHeader` (brand, "Crear ticket", menú de usuario con logout), sin sidebar.
10. **`/panel`**: `PersonasDashboard` (saludo, buscador, filtros con conteos, lista `PersonaTicketCard`, empty state, `CreateTicketModal` con RHF+Zod).
11. **`/panel/tickets/[id]`**: `PersonaTicketDetail` (header con estado/prioridad/numero, descripción inicial, thread con emisor derivado, composer, panel lateral de info). Sin LLM.
12. **Hooks TanStack Query**: `useMyTickets`, `useMyTicket`, `useMyMessages`, `useSendMyMessage`, `useCreateMyTicket`.
13. **Proxy**: proteger `/panel/*` (sesión), `/personas/login` redirige según rol si hay sesión.

## Orden de ejecución

1. Backend: modelo + migración + permisos + register customer.
2. Backend: endpoints `/v1/me/tickets*`.
3. Backend: tests pytest.
4. Frontend: BFF + tipos + labels.
5. Frontend: auth (`/personas/login`, ruteo por rol, store).
6. Frontend: layout persona + dashboard `/panel`.
7. Frontend: detalle `/panel/tickets/[id]`.
8. Verificación integral: pytest, typecheck, lint, build, `test:functional` (suite nueva `tests/persona-flow.test.ts`), smoke E2E.

## Verificación

- Backend: `.venv/bin/python -m pytest -q`, `compileall`.
- Frontend: `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test:functional`.
- Documentar en `ia-docs/init/changes.md` (frontend) e `ia_docs/cambios.md` (backend); marcar en roadmaps.

## Riesgos / notas

- El cliente no tiene asistente LLM: el portal es solo crear/seguir tickets y conversar manualmente.
- `customer_id` ya existe en `tickets`; la migración de `customers.user_id` es la única de esquema nueva.
- El dashboard persona usa refetch (no suscripciones real-time).
