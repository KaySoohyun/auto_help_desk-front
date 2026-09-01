# Arquitectura de Web-app

Sistema SaaS multi-tenant de soporte con base de conocimiento y asistencia LLM responsable. Referencia técnica detallada en `ia-docs/init/spec.md` (diseño integral) y orden de implementación en `ia-docs/init/plan.md`.

## Principios arquitectónicos

1. **Frontend como capa de presentación y orquestación UX** — no maneja reglas críticas de negocio, no decide permisos finales, no confía ciegamente en el estado cliente.
2. **Backend FastAPI como autoridad** — valida tenant, permisos, PII, límites LLM y auditoría en cada operación. El frontend solo muestra lo que el backend autoriza.
3. **BFF para seguridad** — Next.js Route Handlers actúan como Backend For Frontend. El navegador jamás llama a FastAPI directamente.
4. **Separación clara server/client** — Server Components para guards, layouts, metadata y vistas poco interactivas; Client Components para interacciones operativas intensivas.
5. **Estado servidor en TanStack Query** — listas, detalle, mutaciones e invalidaciones. La URL es fuente de verdad para filtros y paginación.
6. **Estado UI liviano en Zustand** — sesión y preferencias visuales (`session.store.ts`, `ui.store.ts`).
7. **Cookies HttpOnly para tokens** — access y refresh nunca visibles para JavaScript.

## Alternativa elegida

**BFF con cookies HttpOnly (Alternativa A del spec).** El BFF recibe requests del navegador, guarda tokens en cookies HttpOnly y llama a FastAPI con `Authorization` header. Manejó refresh/retry, CSRF, tenant y traducción de errores. Ver justificación completa en `spec.md` § 2.2.

## Estructura del proyecto

```
src/
  app/
    (public)/                       # landing con selección de tenants demo
      page.tsx
    [slug]/                         # slug de tenant como primer segmento de la URL
      empresas/
        login/
        register/
      personas/
        login/
        register/
      app/                          # consola de soporte (agente/supervisor/admin)
        page.tsx                    # redirige a app/tickets
        tickets/
          page.tsx
          [ticketId]/
        knowledge/
          articles/
            page.tsx
            [articleId]/
          categories/
        audit/
        admin/
          users/
          customers/                # clientes con email enmascarado
          llm/
      panel/                        # portal de personas (cliente)
        page.tsx                    # mis tickets
        tickets/[ticketId]/
    api/bff/                        # Route Handlers (BFF)
      auth/                         # login, register, refresh, logout, me, tenants, switch-tenant, clear-tenant
      me/
      tickets/                      # + /categories, /[id], /[id]/messages, /[id]/tags..., /[id]/analyze, /[id]/suggestions, /[id]/close
      knowledge/                    # articles, categories
      audit/
        events/
      admin/                        # users, customers, ai-policy, ai-policies/global, ai-info
      agents/
      tags/
      tenants/                      # public, [tenantId]
      llm/                          # chat, classify, summarize, suggest-reply, feedback, pii-redact, stream
    error.tsx
    global-error.tsx
    globals.css

  components/
    ui/                       # shadcn/ui (new-york, neutral) + PaginationControls
    layout/                   # AppShell, Sidebar, Topbar, TenantSwitcher
    features/
      auth/
      tickets/                # bandeja, detalle, properties, thread, paginación
      llm/                    # panel LLM, sugerencias
      knowledge/              # artículos, editor, categorías
      admin/                  # usuarios, clientes, política IA, orquestador, AdminNav
      audit/                  # tabla de eventos
      shared/                 # EmptyState, ErrorState, ConfirmDialog, etc.

  hooks/
    auth/  tickets/  llm/  knowledge/  admin/  audit/

  lib/
    api/                      # authenticatedFetch, bffClient (cliente BFF, correlation id)
    auth/                     # helpers de sesión y cookies (setAuthCookies), csrf.ts
    tenant/                   # resolución slug -> tenant
    permissions/              # permisos por rol (UI)
    pii/                      # detect.ts (detección client-side)
    llm/                      # estado y contratos LLM
    utils.ts  format.ts  constants.ts

  stores/
    session.store.ts
    ui.store.ts

  types/
    auth.types.ts  ticket.types.ts  knowledge.types.ts  audit.types.ts  llm.types.ts
    admin.types.ts  agent.types.ts  tag.types.ts  tenant.types.ts  persona.types.ts

  styles/
    themes.css                # tokens de color (ver ia-docs/desing/colors.md)

proxy.ts                       # protección de rutas y tenant (liviano, sin autorización fina) [Next 16: ex middleware.ts]
```

## Flujo de datos

```
Navegador ──► Proxy (sesión/tenant básico) [ex Middleware]
       ──► Route Handler BFF (/api/bff/...)  ── Authorization ──► FastAPI
       ◄── cookies HttpOnly + datos públicos  ◄──── respuesta/error ──
```

1. El navegador solo llama a rutas internas del BFF.
2. El BFF valida sesión y tenant, adjunta `Authorization`, maneja refresh en 401 y traduce errores.
3. El backend es la única autoridad de permisos y reglas de negocio.
4. Error estándar del BFF (ver `src/lib/api/authenticated.ts`):

```json
{ "error": "Permiso insuficiente", "correlation_id": "abc123" }
```

### Endpoints BFF

```text
POST /api/bff/auth/login          POST /api/bff/auth/register
POST /api/bff/auth/refresh        POST /api/bff/auth/logout
GET  /api/bff/auth/me             GET  /api/bff/auth/tenants
POST /api/bff/auth/switch-tenant  POST /api/bff/auth/clear-tenant

GET/POST    /api/bff/tickets
GET/PATCH   /api/bff/tickets/[ticketId]
GET         /api/bff/tickets/categories
GET/POST    /api/bff/tickets/[ticketId]/messages
POST        /api/bff/tickets/[ticketId]/close
POST        /api/bff/tickets/[ticketId]/analyze
GET         /api/bff/tickets/[ticketId]/suggestions
GET/POST    /api/bff/tickets/[ticketId]/tags
DELETE      /api/bff/tickets/[ticketId]/tags/[tagId]

POST /api/bff/llm/classify   | summarize | suggest-reply | chat | stream | feedback | pii-redact

GET /api/bff/knowledge/articles(...)          GET  /api/bff/knowledge/categories
GET/PATCH  /api/bff/knowledge/articles/[articleId]
POST /api/bff/knowledge/articles/[articleId]/publish|archive|restore
GET  /api/bff/knowledge/articles/[articleId]/versions

GET/POST   /api/bff/admin/users
PATCH      /api/bff/admin/users/[userId]
GET        /api/bff/admin/customers
GET/PUT    /api/bff/admin/ai-policy
GET/PUT    /api/bff/admin/ai-policies/global
GET        /api/bff/admin/ai-info

GET  /api/bff/agents
GET/POST /api/bff/tags
GET  /api/bff/audit/events
GET  /api/bff/tenants/public
GET  /api/bff/me/tickets(...)      (portal de personas)
```

> El alcance de tenant sale del JWT (no de la URL del BFF): `get_effective_tenant_ids` del backend usa el `tenant_id` del token o todos los tenants del usuario vía `user_tenants`. El frontend conoce el slug por el primer segmento de la URL (`useTenantSlug`) y el tenant activo vía sesión.

## Routing

### Público / auth

| Ruta                  | Descripción                         |
|-----------------------|-------------------------------------|
| `/`                   | Landing con tenants demo            |
| `/[slug]/empresas/login` · `/register` | Login/registro portal empresas |
| `/[slug]/personas/login` · `/register` | Login/registro portal personas |

### Consola de soporte (por tenant, `/[slug]/app/*`)

| Ruta                                   | Descripción                     |
|----------------------------------------|---------------------------------|
| `/app`                                 | Redirige a `/app/tickets`       |
| `/app/tickets`                         | Bandeja de tickets              |
| `/app/tickets/[ticketId]`              | Detalle de ticket (3 columnas)  |
| `/app/knowledge` → `/app/knowledge/articles` | Base de conocimiento     |
| `/app/knowledge/articles/[articleId]`  | Artículo / editor               |
| `/app/knowledge/categories`            | Categorías KB                   |
| `/app/audit`                           | Auditoría                       |
| `/app/admin/users`                     | Usuarios del tenant             |
| `/app/admin/customers`                 | Clientes (PII enmascarada)      |
| `/app/admin/llm`                       | Configuración LLM               |

### Portal de personas (por tenant, `/[slug]/panel/*`)

| Ruta                    | Descripción                     |
|-------------------------|---------------------------------|
| `/panel`                | Mis tickets del cliente         |
| `/panel/tickets/[ticketId]` | Conversación (envío manual, sin LLM) |

### Reglas de navegación

- Con sesión y un solo tenant → `/[slug]/app/tickets`.
- Con varios tenants → selector de tenant en el login; cambio vía `TenantSwitcher` (topbar) con `POST /auth/switch-tenant`.
- Sin sesión en rutas protegidas → redirige a `/[slug]/empresas/login` (o `personas` según segmento).
- Sección sin permiso → ocultar nav item; el backend decide (403).

## Modelo de datos

Dominio consumido vía BFF (la fuente de verdad es FastAPI; el frontend no persiste). Tipos en `src/types/`.

### Sesión y tenant

| Entidad       | Campos clave                                                         |
|---------------|----------------------------------------------------------------------|
| `SessionUser` | id, email, name, role, tenantId, tenants[] (`{id,name,slug,role}`)   |
| `TenantInfo`  | id, name, slug, role del usuario en ese tenant                       |

### Tickets

| Entidad        | Campos clave                                                               |
|----------------|----------------------------------------------------------------------------|
| `Ticket`       | id, tenant_id, subject, description (detalle), category, priority, status, assignee_id, assignee `{id,name,email,role}`, customer_id, created/updated, flags (PII, LLM, riesgo) |
| `Message`      | id, ticket_id, author_id, author_name, body (no confiable), created_at     |

Estados de ticket: `open | in_progress | on_hold | closed`. Prioridades: `urgent`, `high`, `medium`, `low`.

### Knowledge

| Entidad       | Campos clave                                                            |
|---------------|-------------------------------------------------------------------------|
| `Article`     | id, title, body, category, tags, status (draft/published/archived), current_version, author_name, published_at |
| `ArticleVersion` | version, autor, cambios, timestamp                                   |

- **UI:** `/[slug]/app/knowledge/*` (listado con filtros en URL, detalle, editor RHF+Zod, historial de versiones, categorías). Agente = solo lectura de `published`; supervisor/admin gestionan (`kb:edit`) y publican (`kb:publish`).
- **Contenido:** texto plano, renderizado con `whitespace-pre-wrap`; sin `dangerouslySetInnerHTML` ni markdown.
- **Integración tickets/LLM:** el panel "Asistente IA" muestra artículos relacionados (según categoría) y permite insertar referencia en el composer, sin envío automático.

### Administración

| Entidad   | Campos clave                                                  |
|-----------|---------------------------------------------------------------|
| `AdminUser` | id, name, email, rol, tenant_id, is_active, created_at (`UserOut`) |
| `AdminCustomer` | id, tenant_id, name, `email_masked` (nunca email crudo), company, plan, created_at |
| `AdminAiPolicy` | tenant_id, ai_enabled, tone, language, allowed_categories, escalation_rules, updated_at |
| `GlobalAiPolicy` | llm_model, ai_confidence_threshold, guardrails_enabled, llm_rate_max_calls |
| `OrchestratorInfo` | provider, model, rate_max_calls, rate_window_seconds, max_retries |

- **UI:** `AdminNav` con tres secciones **"Usuarios | Clientes | Configuración LLM"**:
  - `/app/admin/users` — listado **server-side** (búsqueda por nombre/email y filtro por rol con debounce; paginado `{items,total,limit,offset}`), crear y editar (rol/activo/nombre).
  - `/app/admin/customers` — clientes del portal con **email enmascarado**; búsqueda por nombre y filtro por tenant (server-side), paginado.
  - `/app/admin/llm` — política IA del tenant, política global (solo `platform_admin`) y estado del orquestador.
- **Restricciones por rol:** `tenant_admin` no ofrece `platform_admin` al crear/editar ni puede desactivar su propia cuenta. La política global solo la edita `platform_admin`.
- **BFF:** `/api/bff/admin/users*` → `/admin/users*` (envelope paginado), `/api/bff/admin/customers` → `/admin/customers`, `/api/bff/admin/ai-policy` → `/admin/ai-policy`, `/api/bff/admin/ai-policies/global` → `/admin/ai-policies/global`, `/api/bff/admin/ai-info` → `/v1/ai/info` (todos existentes en FastAPI).

### LLM

| Entidad           | Campos clave                                                               |
|-------------------|----------------------------------------------------------------------------|
| `LlmSuggestion`   | id, type (classification/summary/reply), state (draft/accepted/edited/rejected/flagged), confidence, model, prompt_version, output, created_at |
| `LlmRisk`         | kind (low_confidence/hallucination/pii/prompt_injection/insufficient_context/policy/warning), level, message |
| `LlmStreamEvent`  | token, confianza, done, traceId (SSE)                                       |
| `LlmFeedback`     | suggestionId, action (accepted/edited/rejected/flagged), reason, edited_content_hash, edited_output |

### Auditoría

| Entidad     | Campos clave                                                            |
|-------------|-------------------------------------------------------------------------|
| `AuditEvent`| id, created_at, tenant_id, user_id, action, service, model, model_version, prompt_version, trace_id, result, confidence, detail (JSON) |

- **UI:** `/app/audit` (`AuditEventsView`). Filtros en URL (`service`, `result`, `action`, `user_id`, `date_from`, `date_to`, `page`); fila expandible con `trace_id`, versiones y `detail` como JSON en `<pre>` (nunca HTML). Paginación offset de 50.
- **Exportación:** "Exportar CSV" consulta el BFF con los filtros actuales y `limit: 200`, y descarga CSV con BOM UTF-8.
- **Permisos:** `audit:view` para `tenant_admin`/`platform_admin`/`supervisor`.
- **BFF:** `/api/bff/audit/events` → `/audit/events` (existente en FastAPI), query params validados con Zod.

## Manejo de sesión y cookies

| Cookie          | HttpOnly | Secure         | SameSite   | Path | Vida  |
|-----------------|----------|----------------|------------|------|-------|
| `access_token`  | sí       | solo prod      | Lax        | `/`  | corta |
| `refresh_token` | sí       | solo prod      | Lax        | `/`  | larga |
| `csrf_token`    | no       | solo prod      | Lax        | `/`  | —     |

- **Renovación:** ante 401 del backend, el BFF intenta refresh una vez y reintenta la request; si falla, limpia sesión y devuelve estado expirado (el cliente redirige a `/login`).
- **Logout:** revoca refresh en backend, borra cookies, limpia estado local y query cache sensible.
- **Cierre de sesión / cambio de tenant:** resetear el QueryClient para no reutilizar datos de otro tenant.

## Caché y fetching

- `no-store` en fetch server-side para datos sensibles. Nunca persistir query cache sensible en storage local (solo preferencias UI: tema, densidad).
- TanStack Query con `staleTime` bajo en tickets, `refetchOnWindowFocus` selectivo.
- Query keys siempre con tenant:
  - `['tenant', tenantId ?? 'global', 'tickets', filters]`
  - `['tenant', tenantId ?? 'global', 'ticket', ticketId]`
  - `['tenant', tenantId ?? 'global', 'admin', 'users'|'customers'|'ai-policy', ...]`
  - `['tenant', tenantId ?? 'global', 'agents', ...]`
- Streaming LLM: fetch con `ReadableStream` desde Route Handler (`/api/bff/llm/stream`) + `AbortController`; SSE con cancelación manual.
- Paginación clásica en bandeja, usuario y clientes (`PaginationControls`); filters/`page` en la URL para tickets; filtros + paginación server-side en admin.
- Filtros en URL (search params) parseados con Zod.
- Reintentos: GET con backoff limitado; mutations sin retry automático; 401 → refresh; 403/404 sin retry.
- Invalidación post-mutación: responder → detalle + thread + actividad; estado/prioridad/asignación → lista + detalle; artículo → lista KB + artículo.
- Optimistic updates con cautela (solo tags, feedback LLM y UI local sin riesgo).

## Middleware de Next.js (`proxy.ts`)

Liviano, no decide autorización fina:
- Detecta sesión activa.
- Redirige a `/[slug]/empresas/login` sin sesión.
- Valida estructura básica de `/[slug]/...`.

## Seguridad

- Protección por capas: proxy (ex middleware) → server guard → BFF → backend. La UI nunca es la única barrera.
- Tokens solo en cookies HttpOnly; nunca `localStorage` ni URL.
- PII enmascarada por defecto; revelado con permiso y auditoría. Copia redactada, desalentar copia de PII.
- Prevención XSS: escape de React, sin `dangerouslySetInnerHTML` salvo sanitización explícita, CSP estricta, contenido del cliente siempre no confiable.
- Prompt injection: contenido del cliente tratado como input no confiable; si se sospecha, warning visible, confianza baja y bloqueo de apply automático.
- **Headers de seguridad** (`next.config.ts`): `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (sin cámara/micrófono/geolocalización) y CSP estricta en producción.
- **CSRF doble submit en el BFF** (mutaciones, `src/lib/auth/csrf.ts` + `authenticated.ts`): cookie `csrf_token` no-HttpOnly SameSite=Lax + header `x-csrf-token` comparados con `timingSafeEqual` en todo método ≠ GET (403 fail-closed). El cliente (`bffClient.ts`) lee la cookie y envía el header.
- **Manejo global de 401** (`src/lib/api/sessionEvents.ts`): pub/sub con cooldown; `bffFetch` emite ante 401 (excluye `/api/bff/auth/*`) y `Providers` redirige a `/login`.
- Auditoría de acciones sensibles desde frontend: login/logout, revelado de PII, exportación, sugerencias LLM aceptadas/rechazadas, feedback.

## Observabilidad

- **Correlation id** (`src/lib/api/bffClient.ts`): cada request genera `x-correlation-id` (`crypto.randomUUID()` con fallback), se envía como header y se adjunta al error para reportar/rastrear fallos.
- **Error boundaries**: `src/app/error.tsx` (segmento, centrado con `min-h-dvh`, muestra mensaje + ID de error + "Recargar") y `src/app/global-error.tsx` (raíz, con `<html>/<body>` propios). Ambos registran el error en consola.

## Dependencias principales

- **Next.js (App Router)** — framework full-stack, RSC + Route Handlers.
- **React 19 + TypeScript estricto** — UI y tipos.
- **Tailwind CSS 4** — utility-first CSS.
- **shadcn/ui** — componentes de UI (new-york, neutral).
- **TanStack Query** — server state.
- **Zustand** — estado UI liviano.
- **React Hook Form + Zod** — formularios y validación.
- **Lucide React** — íconos.
- **ESLint + Prettier** — estilo y lint.
- **Vitest** — tests funcionales (`tests/`).
- Fechas: `src/lib/format.ts` (sin date-fns/dayjs).

## Paleta de colores

Tokens definidos en `src/styles/themes.css` (tema oscuro enterprise) y referenciados en `ia-docs/desing/colors.md`. Uso principal:

| Token          | Valor actual      | Uso                             |
|----------------|-------------------|---------------------------------|
| `--color-bark-900` | `#161f1a`     | Fondo de página                 |
| `--color-bark-800` | `#1e2923`     | Fondo de cards y paneles        |
| `--color-bark-700` | `#27352d`     | Superficie elevada, hovers      |
| `--color-bark-300` | `#8fa89b`     | Texto secundario                |
| `--color-caramel-300` | `#ebb07a`  | Primary hover                   |
| `--color-caramel-400` | `#e0a977`  | Primary base                    |
| `--color-caramel-500` | `#d19a66`  | Acento (botones, badges)        |
| `--color-mint-400`  | `#52b788`    | Acento secundario (éxito)       |
| `--color-cream`     | `#38bdf8`    | Acento LLM (texto principal usa `foreground`) |

Colores semánticos (estados, prioridad, SLA, riesgo, LLM) también en `ia-docs/desing/colors.md`.