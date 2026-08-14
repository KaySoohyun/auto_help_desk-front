# Roadmap de implementación por fases y etapas

El detalle de fases y etapas está en `ia-docs/init/plan.md`.

- **013 · Portal de personas** — landing "Personas" → `/personas/login` (login + registro como cliente con selección de tenant), `/panel` (dashboard: mis tickets, buscador, filtros con conteos, crear ticket), `/panel/tickets/[id]` (conversación con envío manual, sin LLM). Rol `customer` en backend con aislamiento por customer/tenant. ✅ Hecho (2026-08-14).

- **Portal empresas multi-tenant** — landing con dos portales, `/empresas/login` con login + registro (selección de uno o varios tenants), auto-login post-registro, selector de tenant post-login y switcher en el Topbar, tickets con alcance al tenant activo o a todos los tenants. ✅ Hecho (2026-08-14; backend en `backend-python/ia_docs/cambios.md`). _(El dashboard se eliminó: `/app` redirige a `/app/tickets`.)_

- **001 · Fundaciones técnicas** — Next.js + TS + Tailwind + shadcn/ui, BFF base, proxy de sesión, login, AppShell. _(Fase 1 · Etapa 1.1 del plan)_
- **002 · Bandeja y detalle de tickets** — listado, filtros por URL, búsqueda client-side, paginación, selección múltiple (sin bulk), conversation thread, respuestas y acciones de estado/prioridad/asignación/cierre. _(Fase 1 · Etapa 1.2)_ ✅
- **003 · Dashboard básico** — KPIs, asignados a mí, abiertos, sin asignar, SLA en riesgo. _(Fase 1 · Etapa 1.3)_ ✅

## En progreso 🟡

_005 a 011 validadas funcionalmente contra FastAPI real (localhost:8000, suite `pnpm test:functional`, 82 tests en verde) salvo donde se indica lo contrario._

- **004 · Panel LLM base** — clasificar/resumir con estados, disclaimer humano. ✅ _(Fase 2 · Etapa 2.1)_
- **005 · Panel LLM avanzado** — streaming SSE, sugerencias en composer, accept/edit/regenerate/reject, PII filtering. Implementado. ⏳ _(Fase 2 · Etapa 2.2)_ Validado: PII-redact real. Pendiente: orquestador ticket-scoped devuelve 422 "Campos de ... inválidos" en el mock (classify/summary/suggested-reply) — investigar en FastAPI; E2E del redirect 401.
- **006 · Confianza y seguridad LLM** — ConfidenceBadge, riesgos, PII, prompt injection, bloqueo de apply, bajo contexto. Implementado. ⏳ _(Fase 2 · Etapa 2.3)_ Validado: `pii-redact` (enmascara email + report). Pendiente: flujo completo con orquestador real (mock bloqueado) + a11y.
- **007 · Base de conocimiento** — listado con filtros, editor con draft/published/archived, versionado por snapshot, permisos por rol e integración con tickets/LLM (artículos relacionados + insertar referencia). Implementado. ⏳ _(Fase 3)_ Pendiente: el backend NO expone `/v1/kb/*` aún (suite documenta el 404 en todas las operaciones) + a11y.
- **008 · Administración** — gestión de usuarios del tenant contra `/admin/users` real. Implementado. ⏳ _(Fase 4 · Etapas 4.1–4.2)_ Validado: RBAC real — agent 403 "Permiso insuficiente"; `platform_admin` crea (201) y edita (200) a nivel plataforma; listado tenant-scoped 403. Pendiente: flujo tenant_admin (listado/gestión por tenant).
- **009 · Auditoría** — vista de eventos de auditoría del tenant (`/audit/events` real). Implementado. ⏳ _(Fase 4 · Etapa 4.3)_ Validado: RBAC 403 (agent / platform_admin). Pendiente: lectura real con usuario `audit:view`.
- **010 · Privacidad, retención y límites LLM** — política IA del tenant y política global del orquestador editables en `/app/admin/llm`. Implementado. ⏳ _(Fase 4 · Etapa 4.4)_ Validado: policy global a nivel plataforma (GET/PUT round-trip real); `ai-info` admin-only. Pendiente: tenant policy con tenant_admin.
- **011 · Hardening** — headers de seguridad y CSP (prod), CSRF doble submit en el BFF (cookies + header, fail-closed en mutaciones), manejo global de 401 (redirect a `/login`), observabilidad (correlation id + error boundaries), `next/dynamic` del panel LLM, accesibilidad (skip-link, WCAG 2.2 AA). Implementado. ⏳ _(Fase 5)_ Validado: headers siempre activos, CSRF 403 fail-closed + 201 con token, 401 JSON sin sesión, CSP en producción (curl -I). Pendiente: E2E del redirect de sesión expirada, load testing, virtualización, densidad configurable.

## Backlog / ideas 💡

_Sin comprometer ni ordenar del todo. Ideas que respetan la constitución._

- **009 · Auditoría** — eventos de usuario y LLM, PII, exportaciones. _(Fase 4 · Etapa 4.3)_ ✅ Hecho (ver arriba)
- **010 · Privacidad, retención y límites LLM** — políticas y configuración. _(Fase 4 · Etapa 4.4)_ ✅ Hecho (ver arriba)
- **011 · Hardening** — performance, seguridad, accesibilidad y observabilidad. _(Fase 5)_ ✅ Hecho (ver arriba)

> Cada feature nueva se crea como `features/NNN-nombre-feature/` con `spec.md`, `plan.md` y `tasks.md` antes de tocar código.