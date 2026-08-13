# Roadmap de implementación por fases y etapas

El detalle de fases y etapas está en `ia-docs/init/plan.md`.

- **001 · Fundaciones técnicas** — Next.js + TS + Tailwind + shadcn/ui, BFF base, proxy de sesión, login, AppShell. _(Fase 1 · Etapa 1.1 del plan)_
- **002 · Bandeja y detalle de tickets** — listado, filtros por URL, búsqueda client-side, paginación, selección múltiple (sin bulk), conversation thread, respuestas y acciones de estado/prioridad/asignación/cierre. _(Fase 1 · Etapa 1.2)_ ✅
- **003 · Dashboard básico** — KPIs, asignados a mí, abiertos, sin asignar, SLA en riesgo. _(Fase 1 · Etapa 1.3)_ ✅

## En progreso 🟡

_005 y 006 están implementadas (build/lint/typecheck OK) pero pendientes de validación funcional contra FastAPI real._

- **004 · Panel LLM base** — clasificar/resumir con estados, disclaimer humano. ✅ _(Fase 2 · Etapa 2.1)_
- **005 · Panel LLM avanzado** — streaming SSE, sugerencias en composer, accept/edit/regenerate/reject, PII filtering. Implementado. ⏳ _(Fase 2 · Etapa 2.2)_ Pendiente: validación funcional + a11y.
- **006 · Confianza y seguridad LLM** — ConfidenceBadge, riesgos, PII, prompt injection, bloqueo de apply, bajo contexto. Implementado. ⏳ _(Fase 2 · Etapa 2.3)_ Pendiente: validación funcional contra FastAPI real + a11y.
- **007 · Base de conocimiento** — listado con filtros, editor con draft/published/archived, versionado por snapshot, permisos por rol e integración con tickets/LLM (artículos relacionados + insertar referencia). Implementado. ⏳ _(Fase 3)_ Pendiente: validación funcional contra FastAPI real (el backend no expone `/v1/kb/*` aún) + a11y.
- **008 · Administración** — gestión de usuarios del tenant (listar, crear, editar rol/activación) contra `/admin/users` real; equipos/roles/SLA/canales/categorías/tags/plantillas documentados como pendientes en FastAPI). Implementado. ⏳ _(Fase 4 · Etapas 4.1–4.2)_ Pendiente: validación funcional contra FastAPI real.
- **009 · Auditoría** — vista de eventos de auditoría del tenant (`/audit/events` real) con filtros por servicio/resultado/acción/usuario/fechas, detalle expandible (JSON en `<pre>`, nunca HTML), paginación offset y exportación CSV client-side (hasta 200 eventos). Permisos `audit:view`/`audit:export`. Implementado. ⏳ _(Fase 4 · Etapa 4.3)_ Pendiente: validación funcional contra FastAPI real.
- **010 · Privacidad, retención y límites LLM** — política IA del tenant y política global del orquestador (`/admin/ai-policy`, `/admin/ai-policies/global` reales) editables en `/app/admin/llm` (con `ai:configure`/`ai:configure-global`), estado del orquestador en solo lectura (`/v1/ai/info`) y sub-nav "Usuarios | Configuración LLM". Retención, privacidad del usuario y config de redacción PII por tenant documentadas como pendientes en FastAPI. Implementado. ⏳ _(Fase 4 · Etapa 4.4)_ Pendiente: validación funcional contra FastAPI real.
- **011 · Hardening** — headers de seguridad y CSP (prod), CSRF doble submit en el BFF (cookies + header, fail-closed en mutaciones), manejo global de 401 (redirect a `/login`), observabilidad (correlation id + error boundaries), `next/dynamic` del panel LLM, accesibilidad (skip-link, WCAG 2.2 AA). Implementado. ⏳ _(Fase 5)_ Pendiente: verificación funcional contra FastAPI real, E2E, load testing, virtualización, densidad configurable.

## Backlog / ideas 💡

_Sin comprometer ni ordenar del todo. Ideas que respetan la constitución._

- **009 · Auditoría** — eventos de usuario y LLM, PII, exportaciones. _(Fase 4 · Etapa 4.3)_ ✅ Hecho (ver arriba)
- **010 · Privacidad, retención y límites LLM** — políticas y configuración. _(Fase 4 · Etapa 4.4)_ ✅ Hecho (ver arriba)
- **011 · Hardening** — performance, seguridad, accesibilidad y observabilidad. _(Fase 5)_ ✅ Hecho (ver arriba)

> Cada feature nueva se crea como `features/NNN-nombre-feature/` con `spec.md`, `plan.md` y `tasks.md` antes de tocar código.