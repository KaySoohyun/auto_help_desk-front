# 008 · Administración — Tasks

Estado: propuesta. Marcar `[ ]` pendiente y `[x]` al completar.

## T1 · Tipos y BFF (sin UI)

- [x] `src/types/admin.types.ts`: `AdminUser` (= `UserOut`), `AdminUserCreatePayload` (email, password, role, tenant_id opcional), `AdminUserUpdatePayload` (role?, is_active?).
- [x] BFF `GET/POST /api/bff/admin/users/route.ts`: lista (Zod con `limit`/`offset`) y crea usuario (email válido, password 8–128, role `platform_admin|tenant_admin|supervisor|agent`, tenant_id ≤64 opcional). Proxy a `/admin/users` con `authenticatedFetch`.
- [x] BFF `PATCH /api/bff/admin/users/[userId]/route.ts`: actualiza rol y/o `is_active` (exige al menos un campo). Proxy a `/admin/users/{userId}`.

## T2 · Hooks TanStack Query

- [x] `src/hooks/admin/queryKeys.ts`: `adminUsersKey(tenantId, query)` con prefijo `'admin'`.
- [x] `src/hooks/admin/useAdminUsers.ts`: query de lista (búsqueda client-side se hace en el componente; el hook recibe `limit`/`offset`).
- [x] Mutaciones: `useCreateAdminUser` y `useUpdateAdminUser` con invalidación de la lista.

## T3 · Permisos UI y nav

- [x] `src/lib/permissions.ts`: agregar `AdminPermission` (`users:read|users:edit`) y matriz por rol (tenant_admin/platform_admin: ambos; supervisor/agent: ninguno).
- [x] `src/components/layout/Sidebar.tsx`: activar "Administración" (enabled según `users:read`, `matchPrefix: true`) con el usuario de la sesión; ocultar/deshabilitar sin permiso.

## T4 · Listado y formularios

- [x] `src/app/app/admin/users/page.tsx` (Server) + `src/components/features/admin/AdminUsersView.tsx` (Client): tabla de usuarios (email, rol, estado activo, creado), búsqueda client-side por email, filtro por rol, estados loading (skeleton)/error/empty.
- [x] `src/components/features/admin/UserCreateForm.tsx` (RHF + Zod): email, password, rol (según permiso del usuario autenticado), tenant_id solo para platform_admin. Errores del BFF (409 email duplicado, 403, 422) visibles.
- [x] `src/components/features/admin/UserEditDialog.tsx` (o form inline): cambiar rol (sin `platform_admin` para tenant_admin) y activar/desactivar con `AlertDialog` de confirmación; `tenant_admin` no puede desactivarse a sí mismo.
- [x] Acciones de edición/creación visibles solo con `users:edit`; la UI oculta, el backend decide.

## T5 · Rutas y estados

- [ ] `src/app/app/admin/page.tsx`: redirige a `/app/admin/users`.
- [ ] Estados de acceso denegado (sin `users:read`) en la vista client.
- [ ] Activación de `Conocimiento` no afectada; nav Administración con link activo para subrutas.

## T6 · Cierre

- [ ] Documentar en `ia-docs/backend/api.md` la sección "Configuración operativa — Pendiente en FastAPI" (equipos, roles, invitaciones, SLA, canales, categorías, tags, plantillas) con tablas de endpoints propuestos.
- [ ] Documentar tablas pendientes en `ia-docs/backend/models.md` (teams, team_members, sla_policies, channels, categories, tags, templates).
- [ ] `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde (0 errores, 0 warnings).
- [ ] Verificación manual con el backend real (listado, crear con restricciones de rol, editar rol, desactivar/activar, acceso agente denegado).
- [ ] Documentar en `ia-docs/init/changes.md`, actualizar `arquitecture.md` (rutas BFF admin, componentes/hooks) y mover 008 a "En progreso" en `ia-docs/constitution/roadmap.md`.
