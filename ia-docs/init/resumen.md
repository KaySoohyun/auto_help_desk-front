# Resumen ejecutivo del proyecto

_Referencia condensada para el agente. Fuente de verdad: los archivos que resume. Si hay contradicción, manda la constitución (`ia-docs/constitution/`), luego el detalle en `ia-docs/init/`._

---

## 1. Qué es

Consola operativa de soporte **SaaS multi-tenant**: agentes resuelven tickets con base de conocimiento y asistencia LLM responsable. Seguridad, PII, auditoría y prevención de fuga de información son requisitos de primer orden.

**Principios rectores:**
- El humano manda, el LLM sugiere (nunca auto-envía ni auto-ejecuta).
- Seguridad y PII primero (enmascarada por defecto; revelado con permiso y auditoría).
- El backend FastAPI es la autoridad (valida tenant, permisos, PII, límites, auditoría).
- Multi-tenant real: URL scoping `/tenant/[tenantSlug]/...`, cero fuga entre tenants.
- Desktop-first, denso pero legible, estados siempre visibles.

## 2. Stack

- Next.js App Router (React 19) + TypeScript estricto, Node 20+
- Tailwind CSS 4 + shadcn/ui (new-york, tema neutral) + Lucide React
- TanStack Query (server state) + Zustand (estado UI liviano)
- React Hook Form + Zod (validación compartida cliente/BFF)
- BFF en Route Handlers; backend FastAPI externo; **no hay DB en el frontend**
- pnpm; ESLint + Prettier

**Comandos:** `pnpm dev` · `pnpm build` · `pnpm start` · `pnpm lint` (0 warnings) · `pnpm typecheck`

## 3. Arquitectura (Alternativa A del spec)

```
Navegador ──► proxy.ts (sesión/tenant básico, ex middleware)
       ──► Route Handler BFF (/api/bff/...) ── Authorization ──► FastAPI
       ◄── cookies HttpOnly + datos públicos ──◄──────────────────
```

- El navegador **solo** llama a `/api/bff/...`. Nunca FastAPI directo.
- BFF guarda tokens en cookies HttpOnly, adjunta Authorization, maneja refresh en 401 (1 retry), tenant, CSRF y traducción de errores.
- Error tipado BFF: `{ error: { code, message, details, correlationId } }`.
- Server Components: guards, layouts, metadata, vistas solo-lectura. Client Components: tablas, filtros, composer, panel LLM, formularios.
- Los guards de servidor nunca reemplazan la autorización del backend.

### Estructura de carpetas (resumen)
- `src/app/` rutas públicas/login/tenant, `api/bff/*`, error/not-found
- `src/components/ui|layout|features/{auth,tickets,llm,knowledge,admin,audit,shared}`
- `src/hooks/{auth,tickets,knowledge,audit,llm}` · `src/lib/{api,auth,tenant,permissions,pii,audit,llm,validation,utils,constants}`
- `src/stores/` session, tenant, ui, ticket-selection · `src/types/` auth, ticket, knowledge, audit, llm · `src/styles/` globals.css, themes.css
- `src/proxy.ts` (Next 16, ex middleware.ts) — guard liviano de rutas

## 4. Sesión y tenant

- **Cookies:** `access_token` (HttpOnly, Secure, SameSite=Lax, Path=/, vida corta) · `refresh_token` (HttpOnly, Secure, SameSite=Strict, Path=/ para refresh automático en `/api/bff/me`) · `csrf_token` legible.
- Access expira 15 min; refresh 30 días con rotación (revoca el usado).
- Refresco: ante 401 del backend, BFF refresca 1 vez y reintenta; si falla limpia sesión.
- Logout: revoca refresh, borra cookies, limpia QueryClient y estado.
- **Cambio de tenant: resetear QueryClient** (no reutilizar datos de otro tenant).
- Reglas de navegación: 1 tenant → dashboard; varios → `/tenant/select`; auth en `/login` → dashboard/select; sin tenant → select.

## 5. Modelo de dominio (tipos en `src/types/`)

- `Ticket`: status `open|in_progress|on_hold|closed` (arquitectura/spec mencionan también `pending|waiting_customer|solved`); priority `urgent|high|medium|low`; SLA `ok|at_risk|breached`; flags PII/LLM/riesgo.
- `Message`: público/interno (nota); contenido del cliente = **no confiable**.
- `Article` (KB): `draft|published|archived`, versionado.
- `LlmSuggestion`: suggestionId, type `classification|summary|reply`, state `draft|accepted|edited|rejected|flagged`, confidence, sources, riesgos, advertencias.
- `AuditEvent`: append-only, sin PII ni secretos; result `success|failure|disabled`.
- Invariantes: filtros en URL; tokens en cookies HttpOnly; query keys con tenant.

### Query keys
`['tenant', tenantSlug, 'tickets'|'ticket'|'knowledge'|'audit'|'dashboard'|'llm', ...]`

## 6. Roles y permisos

| Rol | Permisos (backend) |
| --- | --- |
| `agent` | tickets:read, ai:suggest, responses:edit, responses:send |
| `supervisor` | + audit:view |
| `tenant_admin` | + tenant:configure |
| `platform_admin` | + ai_policies:manage |

- Matriz UI por rol en `src/lib/permissions.ts`; el backend decide siempre.
- PII: agente 🔶, supervisor/admin ✅, auditor 🔶, solo lectura ❌. Auditor read-only.

## 7. API FastAPI (resumen; detalle en `ia-docs/backend/api.md`)

Base URL `http://localhost:8000`. Auth: `Authorization: Bearer <access>`.

- **Auth `/auth`:** register (solo agent/supervisor, 201/403/409), login (200 TokenResponse/401/403), refresh (rotación, 200/401), logout (204), me (UserOut).
- **Tickets `/v1/tickets`** (requieren tenant):
  - POST `/v1/tickets` crear (201 TicketOut) · GET `/v1/tickets` listar con query params `status|categoría|priority|assignee_id|date_from|date_to|limit(1-200,def 50)|offset` → TicketListOut
  - GET/PATCH `/v1/tickets/{id}` (PATCH: status, priority, category, assignee_id)
  - POST/GET `/v1/tickets/{id}/messages` · POST `/v1/tickets/{id}/close`
- **Workspace:** GET `/v1/workspace/my-tickets` (bandeja del agente).
- **IA `/v1/ai`** (permiten 403 si IA deshabilitada, 422 guardrails, 429 rate, 503 global):
  - POST `/v1/ai/ping` · GET `/v1/ai/info` (audit:view)
  - POST `/v1/ai/tickets/{id}/classify` · `/summary` · `/suggested-reply` (body `{tone?, language?}`)
  - POST `/v1/ai/tickets/{id}/feedback` (`action: accepted|edited|rejected|flagged`) · GET `/v1/ai/tickets/{id}/suggestions`
- **PII:** POST `/v1/pii/redact` (`mode: off|detect|redact`).
- **Admin `/admin`** (CONFIGURE_TENANT; global requiere MANAGE_AI_POLICIES): users CRUD, ai-policy del tenant, ai-policies/global.
- **Auditoría:** GET `/audit/events` (filtros por action/service/user_id/result/fechas; paginado).
- **Métricas:** GET `/v1/metrics` (Prometheus).
- **Errores:** `{ "detail": "..." }`; 401/403/404/409/422/429/503.

### Schemas clave de respuesta
- `UserOut`: id, email, role, tenant_id, is_active, created_at
- `TicketListOut`: `{ items: [TicketSummaryOut sin description], total, limit, offset }`
- `ClassificationOut`: category, subcategory, intent, suggested_priority, confidence, rationale, warnings, suggestion_id, trace_id
- `SummaryOut`: summary, missing_information, confidence, warnings, suggestion_id, trace_id
- `SuggestedReplyOut`: suggested_reply, confidence, sources, policy_flags, warnings, suggestion_id, trace_id
- `SuggestionOut`: id, type, state, confidence, model, prompt_version, output (sin PII), created_at
- `AuditEventOut`: id, created_at, tenant_id, user_id, action, service, model, trace_id, result, confidence, detail

> **Nota backend real:** no existen `/chat` ni `/suggest`. Los BFF `chat`/`stream` proxean a `POST /v1/ai/tickets/{id}/suggested-reply`; `stream` envuelve la respuesta como evento SSE único (el cliente lo emite chunked como tokens). `suggest` fue eliminado.

## 8. Seguridad, PII y LLM (reglas duras)

- PII enmascarada por defecto; revelado solo con permiso, motivo opcional y auditoría. Copia redactada, desalentar copia directa.
- Sin `dangerouslySetInnerHTML` salvo sanitización explícita; contenido del cliente nunca HTML confiable; CSP estricta; tokens nunca en localStorage/URL/logs.
- Prompt injection: warning visible, confianza baja, bloqueo de apply automático.
- Toda sugerencia LLM es borrador editable; nunca se envía automáticamente; auditar generación/aceptación/edición/rechazo/feedback/envío.
- CSRF: cookies SameSite Lax/Strict + validación Origin/Referer en mutations; no GET para mutaciones.
- `no-store` para datos sensibles en fetch server-side; no persistir query cache sensible en storage.
- Mutation sin retry automático; GET retry limitado; 401→refresh; 403/404 sin retry; AbortController para filtros y streaming.

## 9. UI y diseño

- Contenido visible en español (argentino); código, commits y tipos en inglés.
- Tema oscuro enterprise: tokens bark/cream/caramel + semánticos (en `ia-docs/desing/colors.md`); siempre usar tokens Tailwind (`text-primary`, `bg-card`, etc.), sin valores hardcodeados.
- Tipografía de sistema. Desktop-first; tablet con sidebar colapsada y panel LLM en drawer.
- a11y: contraste AA, aria-labels, focus-visible, jerarquía de headings, errores no solo por color, `prefers-reduced-motion`. Estados: skeleton por zona, empty state, error con reintentar, acceso denegado.

## 10. Estado del proyecto (roadmap)

- **001 Fundaciones técnicas** — hecho ✅ (BFF auth, proxy.ts, session store, AppShell, login)
- **002 Bandeja y detalle de tickets** — hecho ✅
- **003 Dashboard básico** — hecho ✅
- **004 Panel LLM base** — hecho ✅
- **005 Panel LLM avanzado** — implementado ⏳ (build/lint/typecheck OK; pendiente validación funcional contra FastAPI real + a11y)
- Backlog: 006 confianza/seguridad LLM, 007 KB, 007 administración, 010 auditoría, 011 privacidad/retención, 012 hardening

## 11. Convenciones de trabajo

1. **Spec primero:** `ia-docs/features/NN-nombre/` con `spec.md` → `plan.md` → `tasks.md`; esperar OK antes de codear.
2. Una tarea a la vez; al terminar decir qué se cambió; marcar tareas en `tasks.md`, mover feature a "Hecho" en `roadmap.md`, actualizar docs.
3. Si no estás seguro al 80%, preguntar. No inventar.
4. Documentar bugs en `changes.md`; cambios de arquitectura en `arquitecture.md`; convenciones en `conventions.md`.
5. No instalar dependencias sin avisar; no usar `any` sin justificar; lint 0 warnings; no salir del directorio actual.
6. Datos de prueba (002): `agente-tickets@example.com` / `claveSegura123`, tenant `tenant-tickets`, tickets 1–4.
