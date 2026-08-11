# 003 · Dashboard básico — Tasks

Estado: completado. Marcar `[x]` al completar.

## T1 · Tipos y BFF

- [x] Crear `src/types/dashboard.types.ts` para KPI stats.
- [x] Verificar `GET /api/bff/tickets` soporta filtros `status` y `priority` para KPIs.
- [x] Crear hook `src/hooks/dashboard/useDashboard.ts`.

## T2 · Componentes UI

- [x] Crear `src/components/dashboard/KpiCard.tsx`.
- [x] Crear `src/components/dashboard/DashboardPage.tsx`.
- [x] Crear `src/components/dashboard/DashboardFilters.tsx`.
- [x] Crear página `src/app/app/dashboard/page.tsx`.

## T3 · Integración y cierre

- [x] `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde (0 errores, 0 warnings).
- [x] Prueba contra FastAPI real con usuario con tenant: KPIs visibles, filtros en URL, consistencia con bandeja `/app/tickets`.
- [x] Verificar a11y: contraste AA, labels aria, focus management.
- [x] Documentar en `ia-docs/init/changes.md` y actualizar `arquitecture.md` (nuevos componentes).
- [x] Mover 003 a "Hecho" en `ia-docs/constitution/roadmap.md`.