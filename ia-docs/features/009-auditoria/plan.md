# Feature 009 · Auditoría — Plan

## Contexto
- Backend real: `GET /audit/events` (array plano `[AuditEventOut]`, sin `total`, sin paginación total). Permiso `audit:view`.
- Sin endpoint de exportación → CSV client-side (hasta 200 eventos con filtros actuales).
- Roles de la app: `platform_admin`, `tenant_admin`, `supervisor`, `agent` (no existe "auditor").
- Rutas `/app/*`. Sidebar "Auditoría" dinámica con permiso `audit:view`.

## Estrategia
Reutilizar patrones de 008 (tipos, BFF Zod+`authenticatedFetch`, hooks TanStack Query con invalidación, permisos dinámicos en Sidebar, página `/app/...` con vista Client).

1. **T1 · Tipos y BFF** — `src/types/audit.types.ts` + `src/app/api/bff/audit/events/route.ts` (GET con Zod de query params, proxy a `/audit/events`, devuelve `[AuditEvent]`).
2. **T2 · Hooks y permisos** — `src/hooks/audit/queryKeys.ts` + `useAuditEvents.ts`; `AuditPermission` (`audit:view`, `audit:export`) en `src/lib/permissions.ts`; Sidebar "Auditoría" dinámico (`enabled: "audit"`).
3. **T3 · UI listado** — `src/components/features/audit/AuditEventsView.tsx` (Client): filtros en URL (service, result, action, user_id, date_from, date_to, page), tabla con fecha local / usuario (o "Sistema") / acción / servicio / modelo / resultado (badge) / confianza, fila expandible con `detail` en `<pre>`, estados loading/error/empty/acceso denegado, paginación offset (page size 50, "Siguiente" si página llena).
4. **T4 · Exportación CSV** — botón en la vista (solo `audit:export`): fetch con filtros actuales + `limit: 200`, genera CSV con BOM, descarga. Nota del límite.
5. **T5 · Rutas y estados** — `/app/audit/page.tsx` (Server) + guard; `route.ts` BFF como en T1 (parte de T1). Verificación de build.
6. **T6 · Docs y cierre** — `changes.md`, `arquitecture.md`, `backend/api.md` (marcar `/audit/events` como consumido), `roadmap.md` → 009 "En progreso", tareas en `tasks.md`, build/lint/typecheck final.

## Verificación
- `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde (0 warnings) tras cada etapa.
- Manual contra FastAPI real pendiente (se deja sin marcar en tasks).
