# Spec — 018 · Nombre de usuario y asignación de tickets por rol

> Frontend (`frontend-nextjs`) + Backend (`backend-python`). Acá se documenta la feature completa; el backend se registra en `backend/ia-docs/cambios.md`.

## 1. Problema

Los usuarios no tienen nombre: el modelo `User` solo guarda `email`, `role`, `tenant_id`, `is_active`. Como consecuencia:

- La UI identifica a las personas con placeholders: `Autor #12` (KB), `Agente #12` (thread), `#12` (columna "Asignado" del listado).
- El select "Agente" del detalle solo ofrece "Sin asignar" o "Asignarme"; no hay forma de asignar un ticket a otro agente.
- No hay ninguna regla de asignación: hoy cualquier rol con `EDIT_RESPONSE`/`SEND_RESPONSE` puede setear `assignee_id` a cualquier `int` vía `PATCH /v1/tickets/{id}` sin validación.

## 2. Objetivo

1. Agregar `name` a los usuarios y pedirlo en **todos** los registros (empresas y personas), así como al crear/editar usuarios desde administración.
2. Mostrar **nombre + email chiquito debajo** cuando un usuario aparece como asignado a un ticket (detalle, listado y select de asignación).
3. Aplicar reglas de asignación:
   - **agent**: solo puede asignarse a sí mismo (o desasignar el ticket). No puede asignar a otros.
   - **supervisor / tenant_admin / platform_admin**: pueden asignar a cualquier **agente activo del mismo tenant del ticket**.

## 3. Fuera de alcance

- Equipos/accesos más finos (ABAC), colas, reasignación masiva.
- Notificaciones al agente asignado.
- Marcar nombres en la firma de los mensajes enviados (solo display del thread).
- Nombre para `platform_admin` a nivel plataforma sin tenant: sí se guarda, pero no se usa en selectores de tenant (no tiene tickets de tenant).

## 4. Requisitos funcionales

### FR-01 · Campo `name` en usuarios
- `users.name` (`VARCHAR(255)`, **nullable** en DB por compatibilidad; requerido en registros nuevos y en admin).
- Migración idempotente + backfill: los usuarios existentes sin nombre reciben uno derivado del local-part del email (mismo criterio que `customers.name`).

### FR-02 · Registro con nombre
- `RegisterRequest` acepta y exige `name` (1–255 chars).
- `POST /auth/register` persiste `name`. Para rol `customer`, `customers.name` usa el nombre provisto (fallback al derivado del email).

### FR-03 · Admin con nombre
- `POST /admin/users` (`UserCreate`) exige `name`; `PATCH /admin/users/{id}` acepta `name` opcional.
- La tabla de usuarios del admin muestra la columna `name`.

### FR-04 · Exposición de `name`
- `UserOut.name` (y por lo tanto `/auth/me`, login, lista de admin).
- `SessionUser.name` en el frontend.
- `TicketOut` / `TicketSummaryOut`: objeto `assignee` con `id`, `name`, `email`, `role` (o `null`). Se deja `assignee_id` para no romper contratos existentes.
- `TicketMessageOut`: `author_name`.
- `KbArticleOut`: `author_name`.

### FR-05 · Reglas de asignación (backend)
- `PATCH /v1/tickets/{id}` valida `assignee_id`:
  - `agent` → solo `assignee_id == current_user.id` o `null`. Otro valor → 403.
  - `supervisor`/`tenant_admin`/`platform_admin` → el objetivo debe existir, estar activo, tener rol `agent` y pertenecer al tenant del ticket (vía `user_tenants` o `users.tenant_id`). Si no → 404 (no se filtra existencia). `null` permite desasignar.
- D1 (decisión): los supervisores **no** son asignables en el MVP (la regla pide "cualquier agente"). Si se quiere asignar tickets a supervisores, es un cambio de una línea (agregar rol al set).

### FR-06 · Endpoint de agentes asignables
- `GET /v1/agents` (requiere `tickets:read`): agentes activos de los tenants efectivos del usuario (`id`, `name`, `email`, `role`), para alimentar el select de asignación. El backend sigue validando la regla en el PATCH incluso si la UI filtrara mal.

### FR-07 · UI de asignación (detalle de ticket)
- Select "Agente": opciones = agentes del tenant (name + email chiquito debajo).
  - Rol `agent` → solo "Sin asignar" + él mismo.
  - Otros roles → "Sin asignar" + todos los agentes.
- El trigger muestra el asignado actual con **nombre** y **email debajo en chiquito** ("Sin asignar" si no hay).

### FR-08 · UI de nombres
- Listado de tickets: columna "Asignado" muestra `assignee.name` (o "Sin asignar").
- Thread: mensajes propios "Vos"; los demás muestran `author_name` (fallback "Sistema"). Elimina "Agente #id".
- KB detalle: "Autor" muestra `author_name` (elimina "Autor #id").
- Topbar/menú de usuario: muestra `name` (con `email` debajo) si corresponde; fuera de alcance si agrega ruido.

### FR-09 · Demo
- `scripts/seed_demo_users.py` asigna nombres a los usuarios demo para que la demo luzca real.

## 5. Criterios de aceptación

- Registro (empresas y personas) pide Nombre y el 422 aparece si falta; `/auth/me` devuelve `name`.
- Crear usuario desde admin pide Nombre; editarlo permite cambiar el nombre; la tabla admin lo muestra.
- `GET /v1/agents` solo trae agentes activos de los tenants del usuario.
- Un `agent` recibe 403 al intentar `PATCH` asignar a otro `assignee_id`; puede asignarse a sí mismo.
- `supervisor`/`tenant_admin` pueden asignar a cualquier agente del tenant; 404 si el agente es de otro tenant o no existe.
- El select Agente y el listado muestran nombre + email chiquito; no quedan referencias `#id`/`Autor #` en la UI de tickets/KB.
- Suite backend y suite funcional frontend en verde; `lint` y `typecheck` sin warnings.

## 6. Riesgos

| Riesgo | Mitigación |
|---|---|
| Romper registros existentes en tests al exigir `name` | Conftest/`seedAgent` envían `name`; el campo es nullable en DB |
| Fuga de emails como PII en listados | Emails ya circulan en el sistema (thread/admin); se muestran dentro del tenant |
| Validación de asignación eludible | Se valida en backend en el PATCH; la UI solo filtra |