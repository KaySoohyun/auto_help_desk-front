# 013 · Portal de personas (usuario final / cliente)

**Estado:** completado

## Qué hace

El portal de **Personas** es la cara del usuario final: un cliente de una empresa que abre tickets de soporte, los sigue y conversa con el equipo. Se accede desde la landing ("Personas") y reemplaza el `/login` actual como entrada de este rol. Incluye:

1. **Dashboard de personas** (`/panel`): saludo, creación de ticket, buscador y filtros por estado con conteos, lista de *mis tickets* con estados/prioridades en español.
2. **Detalle de ticket persona** (`/panel/tickets/[id]`): conversación (thread) con envío de mensajes **manual** (sin asistente LLM), panel lateral con información (categoría, empresa, agente asignado, fechas, tiempo estimado).

Base de diseño: `ia-docs/desing/personas-dashboard.md` y `ia-docs/desing/persona-ticket.md` (solo como referencia visual y de interacción; el stack y la arquitectura de datos son los del proyecto).

## Por qué

La misión plantea dos audiencias: empresas (gestores/agentes) y personas (usuarios finales que abren incidencias). Hoy solo existe el lado agente/empresa. Sin el portal de personas no hay "cliente final" que cree y siga sus propios tickets, ni el circuito de auto-respuesta que el diseño describe.

## Contexto real del backend (contratos actuales)

- Modelo de tickets: `Ticket` (id, tenant_id, subject, description, category, priority, status, assignee_id, customer_id, created_at, updated_at). Estados: `open | in_progress | on_hold | closed`; prioridades: `low | medium | high | urgent`.
- `TicketMessage` (id, ticket_id, author_id, body, created_at) — sin `sender` ni `attachments`.
- `Customer` (id, tenant_id, name, email, company, plan, created_at) — la tabla `customers` existe y `tickets.customer_id` ya se migró (FK a customers.id).
- Roles actuales: `platform_admin | tenant_admin | supervisor | agent`. **No existe el rol `customer`** ni endpoints para que un cliente vea/creé sus propios tickets.
- Auth multi-tenant ya resuelto: registro con `tenant_ids`, `POST /auth/clear-tenant`, `GET /v1/tenants/public`, `/auth/me` refleja el tenant activo, scope efectivo (`get_effective_tenant_ids`).

## Decisiones de adaptación (a aprobar)

1. **Rol `customer`** vinculado a tenant (aprobado). Se agrega a `UserRole` y a los roles de registro público. Al registrarse se crea también una fila en `customers` (name/email del usuario) vinculada vía `customers.user_id` (columna nueva). El ticket creado por un cliente setea `tickets.customer_id` a esa fila.
2. **Mis tickets** = `tickets.customer_id` pertenece al `Customer` del usuario logueado (scoped a sus tenants). Endpoints nuevos bajo `/v1/me/tickets*`, protegidos con permiso `persona:tickets` (solo rol `customer`).
3. **Estados**: el backend sigue con `open/in_progress/on_hold/closed` (aprobado); el frontend traduce a español (Abierto, En proceso, En espera, Cerrado) vía un mapa de labels.
4. **Mensajes sin `sender`**: el frontend deriva el emisor comparando `author_id` contra `customer_id`/`customer_user`: `author_id == id del customer user` → "user"; cualquier otro (incluido `null`) → "agent". Sin cambios de esquema en `ticket_messages`.
5. **Sin asistente LLM para el cliente**: el cliente escribe sus mensajes por sí mismo; no hay auto-respuesta, sugerencias ni chat IA en el portal de personas. El portal es solo crear/seguir tickets y conversar manualmente.
6. **Empresa / agente en el detalle**: "Empresa" se muestra desde `customer.company` (o nombre del tenant si falta); "Asignado a" desde `assignee_id` (con "Equipo de soporte" si no hay agente).
7. **Layout persona propio** (aprobado): ruta bajo grupo `(personas)`, header propio sin sidebar de agente.
8. **Login/registro**: nueva página `/personas/login` (login + registro con selección de tenant, reutilizando el patrón del portal empresas). El BFF de registro acepta `role` (`agent` | `customer`). Después del login/registro, si el rol es `customer` → ruta `/panel`; si es agente/empresa → `/app`.
9. **Dashboard persona**: filtros por estado + búsqueda client-side (título/descripción), conteos por estado, botón "Crear nuevo ticket" con modal (RHF+Zod).

## Criterios de aceptación

- [ ] `/personas/login` permite login y registro como cliente (rol `customer`, con selección de tenant).
- [ ] `/panel` lista solo los tickets del cliente logueado, con estados/prioridades en español, búsqueda y filtros por estado con conteos.
- [ ] Crear ticket desde `/panel` → `POST /v1/me/tickets` → aparece en la lista y en el detalle.
- [ ] `/panel/tickets/[id]` muestra conversación (thread), descripción inicial, información lateral (categoría, empresa, agente, fechas) y envío de mensajes manual.
- [ ] El cliente envía sus mensajes por sí mismo; **no hay** auto-respuesta ni asistente LLM en el portal.
- [ ] Un cliente no ve ni puede acceder a tickets de otros clientes (404 cross-tenant / cross-customer).
- [ ] Aislamiento por tenant: un cliente solo opera en sus tenants (`get_effective_tenant_ids`).
- [ ] Contenido visible en español (argentino); errores traducidos.
- [ ] `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde (0 warnings).
- [ ] Backend: `pytest` en verde con tests nuevos de la feature (registro customer, mis tickets, auto-reply, aislamiento).
- [ ] a11y: aria-labels, focus-visible, contraste AA, sin `dangerouslySetInnerHTML`.
- [ ] Proxy: `/panel/*` requiere sesión; `/personas/login` con sesión → redirige a `/panel` (customer) o `/app`.

## Fuera de alcance

- Archivos adjuntos en mensajes (`attachments`).
- Notificaciones push / tiempo real (el diseño usa subscriptions; aquí se usa refetch de TanStack Query).
- Panel de administración para clientes (solo listar/crear/seguir tickets).
- Multi-idioma (solo español).
- **Cualquier asistente LLM para el cliente** (auto-respuesta, sugerencias, chat IA).

## Datos de prueba

- Cliente registrado vía `/auth/register` con rol `customer` en `test-tenant`.
- Tickets creados como ese cliente (algunos en otros estados/prioridades) y tickets de **otros** clientes para verificar el aislamiento (404/ausencia).
