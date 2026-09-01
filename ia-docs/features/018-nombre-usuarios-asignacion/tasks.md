# Tasks — 018 · Nombre de usuario y asignación por rol

> Implementar de a una, actualizando el estado acá. Esperar OK del usuario antes de tocar código.

## Fase B · Backend

### B1 · Modelo y migración
- [x] T1 · `app/models/user.py`: columna `name` (nullable, VARCHAR(255)).
- [x] T2 · `scripts/migrate_users_name.py`: ALTER idempotente + backfill desde el email.

### B2 · Schemas
- [x] T3 · `RegisterRequest.name` (requerido) y `UserOut.name`.
- [x] T4 · `UserCreate.name` (requerido) y `UserUpdate.name` (opcional + validator actualizado).

### B3 · Registro y admin
- [x] T5 · `register()` persiste name; `customers.name` usa el provisto en rol customer.
- [x] T6 · `AdminService.create_user`/`update_user` con `name`; rutas admin lo pasan; auditoría incluye `name`.

### B4 · Endpoint de agentes
- [x] T7 · `GET /v1/agents` (`routes_agents.py`) con `tickets:read`, tenancy efectivo, solo agentes activos.
- [x] T8 · Registrar router en `app/main.py`.

### B5 · Reglas de asignación
- [x] T9 · Validación de `assignee_id` en `update_ticket`: agent → self/null; resto → agente activo del tenant del ticket (404 si no).
- [x] T10 · Auditoría incluye `assignee_name` cuando cambia.

### B6 · Enriquecer nombres
- [x] T11 · `TicketView`/`TicketSummaryView.assignee` (+ batch query en list/get).
- [x] T12 · `MessageView.author_name` (+ resolución en `list_messages`).
- [x] T13 · KB: `KbArticleOut.author_name` + resolución en repositorio.
- [x] T14 · Schemas `ticket.py`/`kb.py` exponen los campos nuevos (mantener `assignee_id`/`author_id`).

### B7 · Demo
- [x] T15 · Nombres en `scripts/seed_demo_users.py`.

### B8 · Tests backend
- [x] T16 · Conftest `register_login` (y helpers) envían `name`.
- [x] T17 · `tests/test_users_name.py`: registro (201/422), `/me`, admin CRUD con nombre.
- [x] T18 · `tests/test_assignments.py`: reglas de asignación + `GET /v1/agents` + isolation.
- [x] T19 · Enrichment: listado/detalle `assignee`, mensajes `author_name`, KB `author_name`.
- [x] T20 · Suite completa en verde y conteo actualizado.

## Fase F · Frontend

### F1 · Tipos
- [x] T21 · `auth.types` (`name` en UserOut/SessionUser/toSessionUser), `Agent`, `ticket.types` (`assignee`, `author_name`), `knowledge.types` (`author_name`).

### F2 · Registro
- [x] T22 · `RegisterForm` + schema name; store `register` envía `name`; BFF register incluye `name`.

### F3 · Admin
- [x] T23 · `UserCreateForm` campo "Nombre"; `UserEditDialog` edita nombre.
- [x] T24 · BFF admin users: `name` en POST/PATCH; hooks con `name`.
- [x] T25 · `AdminUsersView` columna "Nombre".

### F4 · Agentes
- [x] T26 · BFF `agents` + hook `useAgents` (key por tenant).

### F5 · Select de asignación
- [x] T27 · `TicketPropertiesCard`: lista de agentes, filtro por rol, trigger/item con nombre + email chiquito, mapeo "Sin asignar" → null.

### F6 · Listado
- [x] T28 · `TicketsTable`: columna "Asignado" con nombre del agente (sin `#id`).

### F7 · Thread y KB
- [x] T29 · `TicketThread`: `author_name` (eliminar "Agente #id").
- [x] T30 · `ArticleDetailView`: `author_name` (eliminar "Autor #id").

### F8 · Sesión/topbar
- [x] T31 · Mostrar `user.name` en Topbar/menú usuario (si aplica, D3).

### F9 · Tests funcionales
- [x] T32 · `seedAgent` y suites de registro con `name`.
- [x] T33 · Nuevos casos: registro con nombre, agente solo ve self, 403 backend real.

### F10 · Cierre
- [x] T34 · `lint` 0 warnings, `typecheck`, `build`.
- [x] T35 · Docs: `changes.md`, `roadmap.md` (018 → Hecho), backend `cambios.md`.
- [x] T36 · Verificación manual end-to-end (registro, asignación con los roles).

---

## Notas
- **D1** (asignables agentes vs agentes+supervisores), **D2** (platform_admin sin tenant), **D3** (topbar) → confirmar antes de arrancar la Fase B.
- Orden sugerido: Fase B completa → F1..F9. La F8/F10 pueden ir al final.