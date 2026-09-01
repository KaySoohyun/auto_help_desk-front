# Plan — 018 · Nombre de usuario y asignación por rol

**Enfoque general:** cambio de datos + reglas de asignación en el backend primero (contratos), y luego la UI. Se toca código solo después del OK del usuario.

---

## Fase B — Backend (`backend-python`)

### B1 · Modelo y migración
- `app/models/user.py`: agregar `name: Mapped[str | None] = mapped_column(String(255), nullable=True)`.
- `scripts/migrate_users_name.py` (nuevo, patrón de `migrate_customers_user_id.py`):
  - Idempotente: revisa `information_schema.columns`.
  - `ALTER TABLE users ADD COLUMN name VARCHAR(255)`.
  - Backfill: para filas con `name IS NULL`, setear el nombre derivado del local-part del email (`Email.capitalize()` style, misma lógica que `_customer_name_from_email`).

### B2 · Schemas
- `app/schemas/auth.py`:
  - `RegisterRequest`: `name: str = Field(min_length=1, max_length=255)`.
  - `UserOut`: `name: str | None`.
- `app/schemas/admin.py`:
  - `UserCreate`: `name: str` (1–255).
  - `UserUpdate`: `name: str | None = None`; el validator `_at_least_one` pasa a exigir al menos uno de `role`, `is_active`, `name`.

### B3 · Registro y admin
- `app/api/routes_auth.py` `register()`: persistir `payload.name`; para `customer`, `Customer(name=payload.name, ...)`.
- `app/api/routes_admin.py`: pasar `name` a `create_user`/`update_user`.
- `app/services/admin.py`: `create_user(..., name)` y `update_user(..., name)`; auditar `name` en el detail de `user_updated` (sin PII sensible: el nombre va).

### B4 · Endpoint de agentes asignables
- `app/api/routes_agents.py` (nuevo), prefijo `/v1/agents`:
  - `GET /v1/agents` con `require_permissions(READ_TICKETS)` y `get_effective_tenant_ids`.
  - Query: `User` activos con rol `agent` que tengan membresía en `tenant_ids` (join `UserTenant`) **o** `users.tenant_id in tenant_ids` (legacy).
  - Respuesta: `[{id, name, email, role}]` con `AgentOut` (schema nuevo en `app/schemas/agents.py` o `app/schemas/auth.py`).
- Registrar router en `app/main.py`.

### B5 · Validación de asignación en `PATCH /v1/tickets/{id}`
- En `app/api/routes_tickets.py` `update_ticket()`, antes de pasar a `repo.update`:
  1. Resolver el ticket (`_get_or_404`) y capturar `assignee_id` si viene en `payload.model_dump(exclude_unset=True)`.
  2. `agent` → si `assignee_id` no está en `(None, current_user.id)` → 403 "Solo podés asignarte a vos mismo".
  3. Otros roles → si `assignee_id` no es `None`: buscar el `User` objetivo; validar `is_active`, rol `agent`, y pertenencia al `ticket.tenant_id` (membresía `UserTenant` o `users.tenant_id`). Si falla → 404 "Usuario no encontrado".
  4. Recién ahí `repo.update` y auditoría (agregar `assignee_name` al detail si cambió).

### B6 · Enriquecer nombres en respuestas
- `app/repositories/tickets.py`:
  - `TicketView` / `TicketSummaryView`: campo `assignee: AgentRef | None` (dataclass `AgentRef(id, name, email, role)`).
  - En `list()` y `get_or_none()`, tras obtener los tickets, batch-query de `User` por `assignee_id` (una query con `in_`) y asignar.
  - `MessageView`: campo `author_name: str | None`; en `list_messages`, resolver nombres de autores.
- `app/repositories/kb.py` (o en la ruta): `KbArticleOut.author_name` + `ArticleView.author_name`; resolver en listado/detalle/versiones.
- `app/schemas/ticket.py`: `TicketOut`/`TicketSummaryOut` agregan `assignee: AgentRefOut | None` (mantienen `assignee_id`). `TicketMessageOut` agrega `author_name`.
- `app/schemas/kb.py`: `KbArticleOut`/`KbArticleSummaryOut` agregan `author_name`.

### B7 · Seed demo
- `scripts/seed_demo_users.py`: nombres para demo (p. ej. `demo.agente@example.com` → "Agente Demo", supervisor → "Supervisora Demo", admin → "Admin Demo", plataforma → "Admin Plataforma", cliente por tenant → "Cliente Demo · {tenant}").

### B8 · Tests backend
- Ajustar `tests/conftest.py` `register_login` para enviar `name` (los roles públicos que se registran).
- Nuevos archivos:
  - `tests/test_users_name.py`: registro con/sin name (422), `/auth/me` con nombre, admin crea/edita con nombre, tabla admin.
  - `tests/test_assignments.py`: agente autoasignación OK, agente→otro 403, supervisor→agente del tenant OK, →agente de otro tenant 404, →usuario inexistente 404, →rol no agente 403/404, desasignar `null` OK; `GET /v1/agents` solo agentes activos de los tenants efectivos.
  - Enrichment: listado/detalle traen `assignee.name/email`; mensajes traen `author_name`; KB trae `author_name`.
- Suite completa en verde (se actualiza el conteo en `cambios.md`).

---

## Fase F — Frontend (`frontend-nextjs`)

### F1 · Tipos
- `src/types/auth.types.ts`: `UserOut.name`, `SessionUser.name`, `toSessionUser` lo propaga. Nuevo tipo `Agent`.
- `src/types/ticket.types.ts`: `TicketSummary`/`Ticket` agregan `assignee: { id, name, email } | null`; `TicketMessage.author_name`.
- `src/types/knowledge.types.ts`: `author_name: string | null` en artículo/versión.
- Nuevo `src/types/agent.types.ts` (o reutilizar local).

### F2 · Registro con nombre
- `src/components/features/auth/RegisterForm.tsx`: campo "Nombre" (label + input + error), schema `name` requerido en `registerSchema`, se envía al `register` del store.
- `src/stores/session.store.ts`: `RegisterCredentials.name`; body del POST `{ ...body, name }`.
- `src/app/api/bff/auth/register/route.ts`: schema `name` requerido; incluirlo en `registerPayload` hacia `/auth/register`.

### F3 · Admin
- `src/components/features/admin/UserCreateForm.tsx`: campo "Nombre" (requerido) + enviar `name`.
- `src/components/features/admin/UserEditDialog.tsx`: campo "Nombre" (editable).
- `src/app/api/bff/admin/users/route.ts`: `name` en schema POST (requerido) y PATCH (opcional).
- `src/hooks/admin/useCreateAdminUser.ts` / `useUpdateAdminUser.ts`: payload con `name`.
- `src/components/features/admin/AdminUsersView.tsx`: columna "Nombre".

### F4 · Agentes asignables (frontend)
- `src/app/api/bff/agents/route.ts` (nuevo): GET → `/v1/agents`, zod de query (vacío), pasa el auth.
- `src/hooks/tickets/useAgents.ts` (nuevo): query TanStack, key `['tenant', tenantId, 'agents']`, tipado `Agent[]`.

### F5 · Select de asignación en el detalle
- `src/components/features/tickets/TicketPropertiesCard.tsx`:
  - Usa `useAgents()`.
  - Opciones: `unassigned` + agentes filtrados por rol (`agent` → solo self).
  - `SelectItem` con layout: nombre arriba + email chiquito debajo; el trigger (con `<SelectValue>` custom) muestra lo mismo.
  - Al cambiar: `useUpdateTicket({ assignee_id })`. Mapea "unassigned" → `null`.

### F6 · Listado de tickets
- `src/components/features/tickets/TicketsTable.tsx`: columna "Asignado" → `ticket.assignee?.name ?? "Sin asignar"` (email opcional debajo, manteniendo "Sin asignar").

### F7 · Thread y KB
- `src/components/features/tickets/TicketThread.tsx`: `authorName = isOwn ? "Vos" : (author_name ?? "Sistema")`. Elimina "Agente #id".
- `src/components/features/knowledge/ArticleDetailView.tsx`: "Autor" → `article.author_name ?? "Autor desconocido"`. Elimina "Autor #id".

### F8 · Sesión/topbar
- Mostrar `user.name` en el menú de usuario del `Topbar` (con `email` debajo si hay espacio). Si genera ruido, se deja el email y se documenta.

### F9 · Tests funcionales frontend
- `tests/support/client.ts` `seedAgent()`: enviar `name` en `/auth/register`.
- Actualizar suites que registran usuarios (auth, empresa-flow, persona-flow) para incluir `name`.
- Nuevos casos: registro con nombre; agente solo ve self en el select; auditar 403 real si la UI enviara otro `assignee_id` (se valida en backend).

### F10 · Cierre
- `pnpm lint` (0 warnings), `pnpm typecheck`, `pnpm build`.
- Docs: `ia-docs/init/changes.md`, `ia-docs/constitution/roadmap.md` (018 → "Hecho"), backend `ia-docs/cambios.md`.

---

## Decisiones abiertas (confirmar antes de codear)

- **D1 · Asignables:** ¿solo rol `agent`, o también `supervisor`? Spec asume **solo agent** (literal del pedido). Es un cambio trivial si se quiere incluir supervisores.
- **D2 · Plataforma:** `platform_admin` sin tenant: ¿puede asignar a agentes de un tenant? Spec: sí, cualquier agente del tenant del ticket (su "resto de roles" aplica).
- **D3 · Topbar:** ¿mostrar nombre en el menú de usuario (además del email)? Default: sí, si no agrega complejidad.