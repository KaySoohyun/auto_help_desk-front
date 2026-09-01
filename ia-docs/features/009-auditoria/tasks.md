# Feature 009 · Auditoría — Tasks

## T1 · Tipos y BFF

- [x] Crear `src/types/audit.types.ts`: `AuditEvent`, `AuditEventResult`, `AuditEventService`, `AuditEventListQuery`, `AuditEventListParams`.
- [x] Crear `src/app/api/bff/audit/events/route.ts`: `GET` con Zod de query params (`action`, `service`, `user_id`, `result`, `date_from`, `date_to`, `limit` 1–200 default 50, `offset`), proxy a `/audit/events`, devuelve `[AuditEvent]`.

## T2 · Hooks y permisos

- [x] Crear `src/hooks/audit/queryKeys.ts` y `useAuditEvents.ts` (TanStack Query, `AbortController`, staleTime).
- [x] Agregar `AuditPermission` (`audit:view`, `audit:export`) y `hasAuditPermission` en `src/lib/permissions.ts`.
- [x] Sidebar: ítem "Auditoría" con `enabled: "audit"` dinámico y `matchPrefix`.

## T3 · UI listado

- [x] `src/components/features/audit/AuditEventsView.tsx` (Client): filtros en URL, tabla, detalle expandible en `<pre>`, estados loading/error/empty/acceso denegado, paginación offset (page size 50).

## T4 · Exportación CSV

- [x] Botón "Exportar CSV" (solo `audit:export`): fetch con filtros actuales + `limit: 200`, CSV con BOM, descarga, nota del límite.

## T5 · Rutas y estados

- [x] `/app/audit/page.tsx` (Server) con `AuditEventsView`.
- [x] `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde.

## T6 · Docs y cierre

- [x] Actualizar `ia-docs/init/changes.md` (entrada 009), `ia-docs/init/arquitecture.md` (ruta BFF + componente/hooks), `ia-docs/backend/api.md` (marcar `GET /audit/events` como consumido).
- [x] Mover 009 a "En progreso" en `ia-docs/constitution/roadmap.md`.
- [x] Verificación manual contra FastAPI real *(pendiente: requiere `pnpm dev` + backend)*.
- [x] Build/lint/typecheck final.
