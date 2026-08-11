# 003 · Dashboard básico

**Estado:** completado

## Qué hace

Muestra una visión operativa rápida del tenant con KPIs principales: tickets asignados a mí, abiertos, sin asignar y en riesgo SLA. Incluye filtros por URL y estado de loading/error/empty. Es la etapa 1.3 de la Fase 1 del `plan.md`.

## Por qué

El agente y supervisor necesitan una visión general inmediata de su carga de trabajo al entrar al sistema. Sin un dashboard, no pueden priorizar ni identificar riesgos operativos rápidamente. Esta feature cubre el requisito fundamental de "vista rápida" definido en la misión.

## Contexto real del backend (contratos de `ia-docs/backend/api.md`)

- `GET /v1/tickets` → `TicketListOut` con filtros `status`, `priority`, `category`, `assignee_id`, `date_from`, `date_to`, `limit`, `offset`.
- Los tickets tienen campos `status`, `priority`, `assignee_id`, `created_at`, `updated_at`, `sla` (campo de riesgo SLA si existe).
- Errores: 403 si rol sin tenant, 404 si ticket inexistente/otro tenant, 401 por token.

## Decisiones de adaptación (a aprobar)

1. **Filtros en URL**: `status`, `priority`, `assignee_id` via search params, consistente con 002 bandeja.
2. **KPIs calculados en cliente**: conteo de tickets por estado/prioridad usando la query de tickets con filtros vacíos.
3. **SLA visual**: se muestra based on `priority` y `created_at` antigüedad, sin countdowns de SLA complejos (el backend no expone campo SLA dedicado en esta etapa).
4. **Responsive**: desktop-first, table usable con sidebar colapsada y KPIs en columna única.
5. **Sin LLM todavía**: panel LLM queda para Fase 2.

## Criterios de aceptación

- [ ] `/app` lista KPIs con estados de loading (skeleton), error y empty.
- [ ] KPI cards: tickets asignados a mí, abiertos, sin asignar, SLA en riesgo.
- [ ] Filtros por `status` y `priority` viven en la URL (searchParams) y se parsean con Zod.
- [ ] Paginación integrada con la bandeja (mismo `limit`/`offset`).
- [ ] Conteos consistentes con los de la bandeja `/app/tickets` cuando se aplican los mismos filtros.
- [ ] Contenido visible en español; errores traducidos a español.
- [ ] `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde.
- [ ] Sin `dangerouslySetInnerHTML`; números y estados renderizados como texto.
- [ ] a11y: labels/aria en KPI cards, contraste AA, focus visible.

## Fuera de alcance

- LLM (panel lateral, clasificaciones, sugerencias) → Fase 2.
- Gráficos complejos o visualizaciones avanzadas.
- Filtros por fecha/range (se evalúa cuando el backend los exponga).
- Bulk actions desde dashboard.
- Modo claro (solo oscuro).
- Pérdida de filtros al recargar (queda en URL).

## Datos de prueba

- Usuario con tenant asignado y tickets con diversos estados/prioridades.
- Verificar que los KPIs coinciden con los filtros aplicados en la bandeja.