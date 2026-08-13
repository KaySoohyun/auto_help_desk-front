# 008 · Administración — Plan

**Objetivo:** dar al tenant la gestión de usuarios (listar, crear, editar rol/activación) contra el backend real `/admin/users`, activar la navegación de Administración con guard por rol y documentar como pendientes los contratos de equipos, roles, SLA, canales, categorías, tags y plantillas.

## Enfoque

1. **Tipos y BFF primero:** `src/types/admin.types.ts` + rutas `/api/bff/admin/users*`. Mismo patrón que tickets/knowledge (`authenticatedFetch`, Zod, errores BFF tipados).
2. **Hooks TanStack Query** en `src/hooks/admin/` (keys con tenant) + mutaciones con invalidación de la lista.
3. **Permisos UI** en `src/lib/permissions.ts` (`users:read`/`users:edit` para `tenant_admin`/`platform_admin`) y activación del nav "Administración" en `Sidebar.tsx` con guard por rol.
4. **UI en `/app/admin/*`**: listado con búsqueda client-side, crear (RHF+Zod) y editar rol/activación con confirmaciones. Restricciones de rol visibles según usuario autenticado.
5. **Cierre:** documentar contratos pendientes en `backend/api.md` y `models.md`; actualizar `changes.md`, `arquitecture.md` y `roadmap.md`.

## Fuentes

- Spec de esta feature (`spec.md`).
- Etapa 4.1 de `ia-docs/init/plan.md` (gestión de usuarios; invitaciones/equipos/roles quedan pendientes).
- Matriz de permisos de `ia-docs/init/spec.md` § 4.2 (gestionar usuarios: ❌ agent, 🔶 supervisor, ✅ tenant_admin, ✅ platform_admin).
- § Admin de `ia-docs/backend/api.md` (endpoints reales de usuarios).
- `conventions.md` (BFF, query keys con tenant, a11y, sin `dangerouslySetInnerHTML`).
- Patrones existentes: bandeja (002), KB (007) para hooks/BFF/UI.

## Riesgos / supuestos

- **Lista sin paginación server**: `GET /admin/users` devuelve `[UserOut]` plano, sin `total`. Se consume hasta `limit` 200 y se filtra/busca client-side. Si un tenant supera 200 usuarios habrá que pasar a paginación server cuando el backend la exponga (decisión abierta).
- **Restricciones de rol**: la UI refleja las reglas del backend (tenant_admin no crea platform_admin, no se desactiva a sí mismo) pero **no** es la barrera; el backend valida siempre.
- **Contratos pendientes**: solo documentación; no se implementa UI especulativa. No se degradan features existentes.

## Orden de implementación

1. T1 — Tipos + BFF `users` (GET/POST) y `users/[userId]` (PATCH).
2. T2 — Hooks TanStack Query + query keys.
3. T3 — Permisos UI + nav "Administración" con guard.
4. T4 — Listado, búsqueda y crear/editar usuario (RHF+Zod, confirmaciones).
5. T5 — `/app/admin` redirect + estados loading/error/empty/acceso denegado.
6. T6 — Cierre: build/lint/typecheck, docs (backend/api.md, models.md, changes.md, arquitecture.md, roadmap).

## Criterios de aceptación

Ver `spec.md`. Resumen: listado con estados y búsqueda client-side, crear/editar con restricciones por rol, nav con guard, contratos pendientes documentados, build/lint/typecheck en verde, a11y.
