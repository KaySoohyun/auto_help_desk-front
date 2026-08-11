# 003 · Dashboard básico — Plan

## Enfoque

Construir el dashboard sobre la base de 001 y 002, respetando `arquitecture.md`, `conventions.md` y los contratos reales de `ia-docs/backend/api.md`. Todo el contenido visible en español; tipos en `src/types/`; server state con TanStack Query; filtros y paginación en la URL; el navegador solo habla con el BFF.

## Decisiones técnicas

| Decisión | Detalle |
| --- | --- |
| Rutas | `/app` dentro del layout `/app` existente. El dashboard reemplaza el home anterior. |
| KPIs | Contadores de tickets: `asignados a mí`, `abiertos`, `sin asignar`, `SLA en riesgo`. |
| Filtros | searchParams: `status`, `priority`. Cambios navegan con `router.push`. |
| Paginación | Compartida con la bandeja `/app/tickets` (mismo `limit`/`offset`/`total`). |
| Query | TanStack Query con key por tenant: `['tenant', tenantId, 'dashboard', filters]`. |
| Estados | loading (skeleton), error, empty (sin datos con filtros activos). |
| Componentes | `Dashboard`: KPI cards grid, `StatusFilter`, `PriorityFilter`, `TicketsStats`. |
| Seguridad | Visibilidad según rol de sesión (agent/supervisor ven KPIs; platform_admin/tenant_admin pueden variar). |
| a11y | Contraste AA en cards, labels aria en filtros, focus management tras navigación. |

## Pasos de implementación

1. Tipos: `src/types/dashboard.types.ts` (opcional, o reutilizar ticket.types).
2. BFF: verificar que `GET /api/bff/tickets` soporta los filtros necesarios.
3. Hooks de query: `src/hooks/dashboard/useDashboard.ts` con query keys y opciones.
4. Dashboard `/app`: KPI cards grid, filtros, estados loading/error/empty (reemplaza home anterior).
5. Validación: `pnpm build`, `pnpm lint`, `pnpm typecheck` + prueba contra FastAPI real.
6. Cierre: documento `changes.md` y actualizo roadmap.

## Validación

- `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde.
- Dashboard en `/app` (no `/app/dashboard`): KPIs visibles, filtros en URL, consistencia con bandeja.
- Verificar a11y básico y contraste.