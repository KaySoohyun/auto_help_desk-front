# Roadmap de implementación por fases y etapas

El detalle de fases y etapas está en `ia-docs/init/plan.md`.

- **014 · Portal demo multi-tenant con acceso rápido** — empresa (tenant) como primer segmento de la URL: `/` con landing de empresas reales, `/[slug]/personas/login`, `/[slug]/empresas/login`, `/[slug]/app/*` y `/[slug]/panel/*`; rutas legacy redirigen a `/`; botones de acceso rápido con usuarios demo (`demo-pass-123`) en los dos logins (cliente por slug; agente/supervisor/admin tenant/admin plataforma en empresas); navegación con slug. Backend: seed `scripts/seed_demo_users.py` (feature 022). ✅ Hecho (2026-08-18; verificada end-to-end contra backend local, suite funcional 108 passed).

- **016 · Panel IA: aplicar cambios y rediseño de sugerencias** — sección de sugerencias (Clasificación + Resumen) unificada y editable (Categoría como select de categorías existentes, Prioridad, Resumen); "Aplicar cambios" escribe `category`+`priority` reales del ticket y persiste el resumen en la sugerencia (feedback `accepted`/`edited`); consumo al re-entrar vía `GET /suggestions` sin auto-analizar; clasificación oculta si resuelta y resumen siempre visible; categoría como select en Propiedades del ticket; banner de pendientes + confirmación de salida; artículos recomendados por categoría. Backend: output de clasificación sin `subcategory/intent/rationale`, persistencia de valor aplicado/`edited_output` (suite `pytest` 302 passed). ✅ Hecho (2026-08-31; `lint`/`typecheck` OK). _Pendiente: verificación manual como agente en `/acme-corp/app/tickets/11` (feature 016 T15)._

- **015 · Correcciones del detalle de ticket (lado agente)** — navegación con slug, header superior con "Cerrar ticket", Propiedades del ticket reordenado con selects editables (Estado/Prioridad/Agente/Categoría), panel "Asistente IA" renombrado y sin `ConfidenceBadge`. ✅ Hecho (2026-08-31; `lint`/`typecheck` OK). _Pendiente: verificación manual del detalle como agente (feature 015 T17)._

- **017 · Correcciones del detalle de ticket (agente) — errores 7 a 11** — ocultar "Nueva categoría" al agente (8), Propiedades sin desbordes ni spacing excesivo (9), burbujas de chat con tope 3/4 y alineación (10), nombres en negrita (11), y tags con autosuggest + crear (7, backend nuevo). ✅ Hecho (2026-08-31; `lint`/`typecheck` OK; backend `pytest` 302 passed; verificación manual como agente OK).

- **018 · Nombre de usuario y asignación por rol** — campo `users.name` en todos los registros (empresas/personas) y admin; el user muestra **nombre + email** en asignación, listado, thread y KB (se eliminan `#id`/`Autor #`); `GET /v1/agents` para el selector; reglas de asignación: **agent** solo se asigna a sí mismo (403 si otro), **supervisor/tenant_admin/platform_admin** asignan a cualquier agente activo del tenant del ticket (404 si no). ✅ Hecho (2026-08-31; backend `pytest` 319 passed; frontend `lint`/`typecheck`/`build` en verde; `pnpm test:functional` 109 passed con `name` en los tests de admin y sin `intent` en classify). _Pendiente: migración `scripts/migrate_users_name.py` + reseed demo ya ejecutada._



- **013 · Portal de personas** — landing "Personas" → `/personas/login` (login + registro como cliente con selección de tenant), `/panel` (dashboard: mis tickets, buscador, filtros con conteos, crear ticket), `/panel/tickets/[id]` (conversación con envío manual, sin LLM). Rol `customer` en backend con aislamiento por customer/tenant. ✅ Hecho (2026-08-14). _(Nota: con 014, las rutas quedaron bajo `/[slug]/`.)_

- **Portal empresas multi-tenant** — landing con dos portales, `/empresas/login` con login + registro (selección de uno o varios tenants), auto-login post-registro, selector de tenant post-login y switcher en el Topbar, tickets con alcance al tenant activo o a todos los tenants. ✅ Hecho (2026-08-14; backend en `backend-python/ia_docs/cambios.md`). _(El dashboard se eliminó: `/app` redirige a `/app/tickets`; con 014 las rutas quedaron bajo `/[slug]/`.)_

- **004 · Panel LLM base** — clasificar/resumir con estados, disclaimer humano. ✅ Hecho (2026-09-01; revalidado contra FastAPI real: `classify`/`summary` 200 con mock determinista). _(Fase 2 · Etapa 2.1)_

- **005 · Panel LLM avanzado** — streaming SSE, sugerencias en composer, accept/edit/regenerate/reject, PII filtering. ✅ Hecho (2026-09-01; el 422 "Campos de ... inválidos" del orquestador en mock está resuelto: `classify`/`summary`/`suggested-reply` 200; `pii-redact` real; `analyze` 200 con classify+summary+reply+PII+risks). _(Fase 2 · Etapa 2.2)_

- **006 · Confianza y seguridad LLM** — ConfidenceBadge, riesgos, PII, prompt injection, bloqueo de apply, bajo contexto. ✅ Hecho (2026-09-01; flujo `analyze` completo 200 y PII-redact real enmascara email + report). _(Fase 2 · Etapa 2.3)_

- **007 · Base de conocimiento** — listado con filtros, editor con draft/published/archived, versionado por snapshot, permisos por rol e integración con tickets/LLM (artículos relacionados + insertar referencia). ✅ Hecho (2026-09-01; el backend ahora expone `/v1/kb/*` completo en `routes_kb.py` — categorías y artículos validados con `supervisor`). _(Fase 3)_

- **008 · Administración** — gestión de usuarios del tenant contra `/admin/users` real. ✅ Hecho (2026-09-01; flujo tenant_admin — listado/crear/editar — validado por suite funcional 109 tests). _(Fase 4 · Etapas 4.1–4.2)_

- **009 · Auditoría** — vista de eventos de auditoría del tenant (`/audit/events` real). ✅ Hecho (2026-09-01; lectura real con `supervisor` (`audit:view`) devuelve eventos; RBAC 403 para agent/platform_admin). _(Fase 4 · Etapa 4.3)_

- **010 · Privacidad, retención y límites LLM** — política IA del tenant y política global del orquestador editables en `/app/admin/llm`. ✅ Hecho (2026-09-01; `GET /admin/ai-policy` con tenant_admin 200; frontend null-safe para `allowed_categories`/`escalation_rules` null; global 403 al tenant_admin es lo correcto). _(Fase 4 · Etapa 4.4)_

- **001 · Fundaciones técnicas** — Next.js + TS + Tailwind + shadcn/ui, BFF base, proxy de sesión, login, AppShell. _(Fase 1 · Etapa 1.1 del plan)_
- **002 · Bandeja y detalle de tickets** — listado, filtros por URL, búsqueda client-side, paginación, selección múltiple (sin bulk), conversation thread, respuestas y acciones de estado/prioridad/asignación/cierre. _(Fase 1 · Etapa 1.2)_ ✅
- **003 · Dashboard básico** — KPIs, asignados a mí, abiertos, sin asignar, SLA en riesgo. _(Fase 1 · Etapa 1.3)_ ✅

## En progreso 🟡

- **011 · Hardening** — headers de seguridad y CSP (prod), CSRF doble submit en el BFF (cookies + header, fail-closed en mutaciones), manejo global de 401 (redirect a `/login`), observabilidad (correlation id + error boundaries), `next/dynamic` del panel LLM, accesibilidad (skip-link, WCAG 2.2 AA). Implementado. ⏳ _(Fase 5)_ Validado: headers siempre activos, CSRF 403 fail-closed + 201 con token, 401 JSON sin sesión, CSP en producción (curl -I). Pendiente: E2E del redirect de sesión expirada, load testing, virtualización, densidad configurable.

## Backlog / ideas 💡

_Sin comprometer ni ordenar del todo. Ideas que respetan la constitución._

> Cada feature nueva se crea como `features/NNN-nombre-feature/` con `spec.md`, `plan.md` y `tasks.md` antes de tocar código.