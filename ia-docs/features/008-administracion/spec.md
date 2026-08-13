# 008 · Administración

**Estado:** propuesta.
**Alcance:** Etapa 4.1 parcial (gestión de usuarios) + documentación de contratos pendientes (Etapa 4.2 y resto de 4.1).
**Bloqueo conocido:** el backend FastAPI expone **solo** gestión de usuarios (`/admin/users`) y políticas LLM (`/admin/ai-policy`). No existen equipos, roles CRUD, invitaciones, SLA, canales, catálogo de categorías/tags ni plantillas. Esta feature implementa usuarios contra el backend real y documenta el resto como contratos **pendientes de implementación en FastAPI** (mismo patrón que 007 KB).

## Qué hace

Administración del tenant: el `tenant_admin` y el `platform_admin` gestionan los usuarios de su tenant (listar, crear, cambiar rol y activar/desactivar) en `/app/admin/users`. Las demás secciones de administración (equipos, roles, SLA, canales, categorías, tags, plantillas) quedan documentadas como contratos pendientes, **sin UI** en esta feature.

## Por qué

La misión exige "Administración y auditoría — usuarios, roles, equipos, SLA, configuración del tenant". Hoy no hay forma de gestionar usuarios desde la consola: se crean por `register` público o vía API directa. La gestión de usuarios es la base para los demás módulos de administración y para controlar quién accede al tenant.

## Contexto real del backend

- **Existen** (`ia-docs/backend/api.md` § Admin):
  - `GET /admin/users` → `[UserOut]` (array plano; query `limit` 1–200 default 50, `offset`). Permiso `CONFIGURE_TENANT`.
  - `POST /admin/users` → crea usuario (email, password 8–128, role, `tenant_id` **obligatorio** para `platform_admin`; `tenant_admin` solo en su tenant y roles `tenant_admin|supervisor|agent`). **201** → `UserOut`; **403** rol fuera de alcance; **409** email duplicado; **422** falta `tenant_id`.
  - `PATCH /admin/users/{user_id}` → actualiza `role` y/o `is_active`. `tenant_admin` no puede asignar `platform_admin` ni desactivarse a sí mismo. **200** → `UserOut`; **404**; **422** sin `role` ni `is_active`.
- **No existen:** invitaciones, equipos, roles CRUD, SLA, canales, categorías, tags, plantillas. **Decisión (aprobada):** se documentan como contratos pendientes en `backend/api.md` y `models.md`; no se construye UI especulativa.

## Decisiones de diseño

1. **Rutas reales `/app/*`** (mismo criterio que 007): `/app/admin` → redirige a `/app/admin/users`; `/app/admin/users`.
2. **Tipos en `src/types/admin.types.ts`**: `AdminUser` (= `UserOut`), `AdminUserCreatePayload`, `AdminUserUpdatePayload`. Reutiliza `UserRole` de `auth.types.ts`.
3. **BFF** `src/app/api/bff/admin/users/route.ts` (GET lista, POST crea) y `admin/users/[userId]/route.ts` (PATCH). Proxy a `/admin/users` con `authenticatedFetch` y Zod en el Route Handler. El backend devuelve un **array plano** (sin `total`): la lista se consume completa (hasta `limit` 200) y la búsqueda/role filter son **client-side**. No hay filtros en URL porque es metadata administrativa de un conjunto acotado (decisión justificada frente a la invariante de filtros en URL, que aplica a listas operativas).
4. **Permisos UI** en `src/lib/permissions.ts`: `AdminPermission` (`users:read`, `users:edit`) habilitado para `tenant_admin` y `platform_admin`. La UI oculta acciones; el backend decide. El nav "Administración" se activa según `users:read` (o `tenant:configure`).
5. **Restricciones de rol en UI** (el backend decide): al crear, `tenant_admin` ofrece solo `tenant_admin|supervisor|agent` (sin `platform_admin`); `platform_admin` ofrece todos y pide `tenant_id`. Al editar, `tenant_admin` no puede asignar `platform_admin` ni desactivarse a sí mismo. Desactivar (y activar) con `AlertDialog` de confirmación.
6. **Formulario con RHF + Zod** (patrón de la app): email + password (crear), rol; `is_active` en edición. Errores del BFF tipados en toast/banner.
7. **Sin nuevas dependencias.**
8. **Cierre:** documentar contratos pendientes en `backend/api.md` (§ Configuración operativa — pendiente) y `models.md` (tablas pendientes); actualizar `changes.md`, `arquitecture.md` y `roadmap.md`.

## Criterios de aceptación

- [ ] `/app/admin/users` lista los usuarios del tenant con estados loading/error/empty y búsqueda client-side (email).
- [ ] `tenant_admin` y `platform_admin` pueden crear un usuario con validación de email/password/rol; `tenant_admin` no puede crear `platform_admin`.
- [ ] Se puede cambiar rol y activar/desactivar usuario, con confirmación para desactivar; `tenant_admin` no puede desactivarse a sí mismo.
- [ ] El nav "Administración" aparece solo con permiso (`users:read`); sin permiso la sección permanece oculta/deshabilitada.
- [ ] Agente y supervisor no ven la sección ni pueden acceder por URL.
- [ ] Contratos pendientes (equipos, roles, SLA, canales, categorías, tags, plantillas) documentados en `ia-docs/backend/api.md` y `models.md` como pendientes de FastAPI.
- [ ] `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde (0 errores, 0 warnings).
- [ ] a11y: contraste AA, labels, focus-visible, confirmaciones con foco gestionado.

## Fuera de alcance

- Invitaciones por email, equipos y CRUD de roles (Etapa 4.1) — contratos pendientes, sin UI.
- SLA, canales, catálogo de categorías/tags y plantillas (Etapa 4.2) — contratos pendientes, sin UI.
- Auditoría (feature 009) y privacidad/retención/límites LLM (feature 010).
- Gestión de tenants globales y planes (platform admin multi-tenant).
- PII de usuarios (la gestión de usuarios no revela PII de clientes).

## Datos de prueba

- `tenant_admin` de `tenant-tickets` puede crear `supervisor`/`agent` con email/password; no ve la opción `platform_admin`.
- `platform_admin` puede crear cualquier rol y asignar `tenant_id`.
- Desactivar un usuario lo impide de iniciar sesión (lo valida el backend).
- Verificación de que un `agent` no ve "Administración" en el sidebar ni accede a `/app/admin/users`.
