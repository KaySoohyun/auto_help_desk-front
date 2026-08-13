# Arquitectura de Web-app

Sistema SaaS multi-tenant de soporte con base de conocimiento y asistencia LLM responsable. Referencia técnica detallada en `ia-docs/init/spec.md` (diseño integral) y orden de implementación en `ia-docs/init/plan.md`.

## Principios arquitectónicos

1. **Frontend como capa de presentación y orquestación UX** — no maneja reglas críticas de negocio, no decide permisos finales, no confía ciegamente en el estado cliente.
2. **Backend FastAPI como autoridad** — valida tenant, permisos, PII, límites LLM y auditoría en cada operación. El frontend solo muestra lo que el backend autoriza.
3. **BFF para seguridad** — Next.js Route Handlers actúan como Backend For Frontend. El navegador jamás llama a FastAPI directamente.
4. **Separación clara server/client** — Server Components para guards, layouts, metadata y vistas poco interactivas; Client Components para interacciones operativas intensivas.
5. **Estado servidor en TanStack Query** — listas, detalle, mutaciones e invalidaciones. La URL es fuente de verdad para filtros y paginación.
6. **Estado UI liviano en Zustand** — sesión, tenant activo, preferencias visuales, selección de filas, panel LLM abierto/cerrado.
7. **Cookies HttpOnly para tokens** — access y refresh nunca visibles para JavaScript.

## Alternativa elegida

**BFF con cookies HttpOnly (Alternativa A del spec).** El BFF recibe requests del navegador, guarda tokens en cookies HttpOnly y llama a FastAPI con `Authorization` header. Manejó refresh/retry, CSRF, tenant y traducción de errores. Ver justificación completa en `spec.md` § 2.2.

## Estructura del proyecto

```
src/
  app/
    (public)/
      login/
      forgot-password/
      reset-password/
      error/
    (auth)/
      tenant/
        select/
    tenant/
      [tenantSlug]/
        dashboard/
        tickets/
          [ticketId]/
        knowledge/
          articles/
            [articleId]/
          categories/
        admin/
          users/
          teams/
          roles/
          sla/
          channels/
          categories/
          tags/
          templates/
          retention/
          llm/
          privacy/
        audit/
        settings/
          profile/
          preferences/
          security/
    api/
      bff/
        auth/
        tenants/
        tickets/
        knowledge/
        audit/
        admin/
    error.tsx
    global-error.tsx
    not-found.tsx

  components/
    ui/                       # shadcn/ui (new-york, neutral)
    layout/                   # AppShell, Sidebar, Topbar, TenantSwitcher, GlobalSearch, UserMenu
    features/
      auth/
      tickets/                # bandeja, detalle, composer, timeline
      llm/                    # panel LLM, sugerencias, confidence, risks
      knowledge/              # artículos, editor, categorías
      admin/                  # usuarios, equipos, roles, SLA, config
      audit/                  # tabla de eventos, filtros, export
      shared/                 # EmptyState, ErrorState, ConfirmDialog, PiiMaskedField, etc.

  hooks/
    auth/
    tickets/
    knowledge/
    audit/
    llm/

  lib/
    api/                      # cliente BFF tipado (fetch + errores)
    auth/                     # helpers de sesión y cookies
    tenant/                   # resolución tenantSlug -> tenantId, guards
    permissions/              # permisos por rol (UI)
    pii/                      # enmascarado y revelado
    audit/                    # helpers de auditoría
      llm/                      # estado, contratos LLM, riesgos, confianza e injection
    validation/               # schemas Zod
    utils/                    # helpers generales
    constants/                # estados, prioridades, canales, query keys

  stores/
    session.store.ts
    tenant.store.ts
    ui.store.ts
    ticket-selection.store.ts

  types/
    auth.types.ts
    ticket.types.ts
    knowledge.types.ts
    audit.types.ts
    llm.types.ts

  styles/
    globals.css
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
2. El BFF valida sesión y tenant, adjunta `Authorization`, maneja refresh en 401 y traduce errores a un formato tipado con `correlationId`.
3. El backend es la única autoridad de permisos y reglas de negocio.
4. Error estándar del BFF:

```json
{
  "error": {
    "code": "FORBIDDEN_TENANT",
    "message": "No tienes acceso a este tenant.",
    "details": [],
    "correlationId": "abc123"
  }
}
```

### Endpoints BFF aproximados

```text
POST /api/bff/auth/login
POST /api/bff/auth/refresh
POST /api/bff/auth/logout
GET  /api/bff/me
GET  /api/bff/tenants

GET  /api/bff/tenant/[tenantSlug]/tickets
GET  /api/bff/tenant/[tenantSlug]/tickets/[ticketId]
POST /api/bff/tenant/[tenantSlug]/tickets/[ticketId]/reply
POST /api/bff/tenant/[tenantSlug]/tickets/[ticketId]/notes
POST /api/bff/tenant/[tenantSlug]/tickets/[ticketId]/llm/classify
POST /api/bff/tenant/[tenantSlug]/tickets/[ticketId]/llm/summarize
POST /api/bff/tenant/[tenantSlug]/tickets/[ticketId]/llm/suggest-reply

POST /api/bff/llm/classify
POST /api/bff/llm/summarize
POST /api/bff/llm/chat
POST /api/bff/llm/stream
POST /api/bff/llm/suggest-reply
POST /api/bff/llm/pii-redact
POST /api/bff/llm/feedback

GET  /api/bff/knowledge/articles
POST /api/bff/knowledge/articles
GET  /api/bff/knowledge/articles/[articleId]
PATCH /api/bff/knowledge/articles/[articleId]
POST /api/bff/knowledge/articles/[articleId]/publish
POST /api/bff/knowledge/articles/[articleId]/archive
POST /api/bff/knowledge/articles/[articleId]/restore
GET  /api/bff/knowledge/articles/[articleId]/versions

GET  /api/bff/admin/users
POST /api/bff/admin/users
PATCH /api/bff/admin/users/[userId]

GET  /api/bff/audit/events
```

> Nota: el backend real no expone `/chat` ni `/suggest`. Los BFF `chat` y `stream` proxean a `POST /v1/ai/tickets/{id}/suggested-reply`; `stream` envuelve la respuesta como evento SSE único y el cliente la emite chunked como tokens en tiempo real. `/api/bff/llm/suggest` fue eliminado (endpoint inexistente).
>
> Los endpoints de **Knowledge Base** (`/api/bff/knowledge/*`) proxean a `/v1/kb/*`, contratos definidos por la feature 007 y **pendientes de implementación en FastAPI** (ver `ia-docs/backend/api.md` § Knowledge Base). El frontend ya está implementado contra esos contratos; la validación funcional real queda pendiente hasta que el backend exista.
>
> Los endpoints de **Administración** (`/api/bff/admin/users*`) proxean a `/admin/users*` (existentes en FastAPI). El resto de la configuración operativa (equipos, roles, SLA, canales, categorías, tags, plantillas) está **pendiente en FastAPI** y solo documentado (ver § Configuración operativa); sin UI en el frontend.
>
> Los endpoints de **Auditoría** (`/api/bff/audit/events`) proxean a `/audit/events` (existente en FastAPI). La exportación a CSV se genera client-side sobre los eventos obtenidos (hasta 200 por request, límite del backend); no hay endpoint de exportación.

## Routing

### Público / auth

| Ruta                     | Descripción                         |
|--------------------------|-------------------------------------|
| `/login`                 | Inicio de sesión                    |
| `/login/mfa`             | Verificación MFA                    |
| `/forgot-password`       | Recuperación de contraseña          |
| `/reset-password`        | Restablecer contraseña              |
| `/tenant/select`         | Selección de tenant (autenticado)   |
| `/error/access-denied`   | Acceso denegado                     |
| `/error/not-found`       | No encontrado                       |
| `/error/server`          | Error de servidor                   |

### Por tenant

| Ruta                                     | Descripción                     |
|------------------------------------------|---------------------------------|
| `/tenant/[tenantSlug]/dashboard`         | Resumen operativo               |
| `/tenant/[tenantSlug]/tickets`           | Bandeja de tickets              |
| `/tenant/[tenantSlug]/tickets/[ticketId]`| Detalle de ticket               |
| `/tenant/[tenantSlug]/knowledge`         | Base de conocimiento            |
| `/tenant/[tenantSlug]/knowledge/articles`| Listado de artículos            |
| `/tenant/[tenantSlug]/knowledge/articles/[articleId]` | Artículo / editor |
| `/tenant/[tenantSlug]/knowledge/articles/new` | Nuevo artículo            |
| `/tenant/[tenantSlug]/knowledge/categories` | Categorías                  |
| `/tenant/[tenantSlug]/audit`             | Auditoría                       |
| `/tenant/[tenantSlug]/settings/profile`  | Perfil                          |
| `/tenant/[tenantSlug]/settings/preferences` | Preferencias                |
| `/tenant/[tenantSlug]/settings/security` | Seguridad / MFA                 |

### Administración por tenant

| Ruta                                         | Descripción            |
|----------------------------------------------|------------------------|
| `/tenant/[tenantSlug]/admin/users`           | Usuarios e invitaciones|
| `/tenant/[tenantSlug]/admin/teams`           | Equipos                |
| `/tenant/[tenantSlug]/admin/roles`           | Roles y permisos       |
| `/tenant/[tenantSlug]/admin/sla`             | Políticas SLA          |
| `/tenant/[tenantSlug]/admin/channels`        | Canales                |
| `/tenant/[tenantSlug]/admin/categories`      | Categorías             |
| `/tenant/[tenantSlug]/admin/tags`            | Tags                   |
| `/tenant/[tenantSlug]/admin/templates`       | Plantillas             |
| `/tenant/[tenantSlug]/admin/retention`       | Retención              |
| `/tenant/[tenantSlug]/admin/llm`             | Configuración LLM      |
| `/tenant/[tenantSlug]/admin/privacy`         | Privacidad / PII       |

### Reglas de navegación

- Login con un solo tenant → `/tenant/[tenantSlug]/dashboard`.
- Login con varios tenants → `/tenant/select`.
- Usuario autenticado en `/login` → dashboard o tenant select.
- Sin tenant activo → `/tenant/select`.
- Sección sin permiso → ocultar nav item; si entra por URL → acceso denegado.

## Modelo de datos

Dominio consumido vía BFF (la fuente de verdad es FastAPI; el frontend no persiste). Tipos en `src/types/`.

### Sesión y tenant

| Entidad       | Campos clave                                                         |
|---------------|----------------------------------------------------------------------|
| `UserSession` | user, tenants permitidos, tenant activo, rol, permisos, flags de seguridad |
| `Tenant`      | tenantId, slug, nombre, rol del usuario, features, límites LLM       |

### Tickets

| Entidad        | Campos clave                                                               |
|----------------|----------------------------------------------------------------------------|
| `Ticket`       | id, asunto, estado, prioridad, canal, agente, SLA, tags, updatedAt, flags (PII, LLM, riesgo) |
| `Message`      | id, tipo (publico/interno/nota), autor, contenido, adjuntos, timestamps    |
| `TicketEvent`  | id, tipo de evento, autor, payload permitido, timestamp                   |

Estados de ticket: `open`, `pending`, `waiting_customer`, `solved`, `closed`. Prioridades: `urgent`, `high`, `medium`, `low`. SLA: `ok`, `at_risk`, `breached`.

### Knowledge

| Entidad       | Campos clave                                                            |
|---------------|-------------------------------------------------------------------------|
| `Article`     | id, título, categoría, tags, estado (draft/published/archived), versión, autor, métricas |
| `ArticleVersion` | versión, autor, cambios, timestamp                                   |

- **UI:** `/app/knowledge/*` (listado con filtros en URL, detalle, editor RHF+Zod, historial de versiones, taxonomy de categorías). Agente = solo lectura de `published`; supervisor/admin gestionan (`kb:edit`) y publican (`kb:publish`).
- **Contenido:** texto plano, renderizado con `whitespace-pre-wrap`; sin `dangerouslySetInnerHTML` ni markdown.
- **Integración tickets/LLM:** `LlmAssistantPanel` muestra una sección "Artículos relacionados" (artículos `published` por categoría del ticket vía `useArticles`) y "Insertar referencia" agrega una línea citable al composer vía `onUseReply`, sin envío automático.

### Administración

| Entidad   | Campos clave                                                  |
|-----------|---------------------------------------------------------------|
| `AdminUser` | id, email, rol, tenant_id, activo, creado (`UserOut`)        |

- **UI:** `/app/admin/users` (listado con búsqueda client-side por email y filtro por rol, crear y editar rol/activación). Solo `tenant_admin`/`platform_admin` (`users:read`/`users:edit`); la UI oculta acciones y el backend decide.
- **Restricciones por rol:** `tenant_admin` no ofrece `platform_admin` al crear/editar ni puede desactivar su propia cuenta.
- **BFF:** `/api/bff/admin/users*` → `/admin/users*` (existentes en FastAPI).
- **Contratos pendientes:** equipos, roles CRUD, invitaciones, SLA, canales, categorías, tags y plantillas documentados como pendientes en `backend/api.md` y `models.md`; sin UI.

### LLM

| Entidad           | Campos clave                                                               |
|-------------------|----------------------------------------------------------------------------|
| `LlmSuggestion`   | suggestionId, tipo (classify/summarize/suggest_reply/chat/suggest), modelVersion, confidence, sources, riesgos, advertencias |
| `LlmRisk`         | kind (`low_confidence|hallucination|pii|prompt_injection|insufficient_context|policy|warning`), level (`low|medium|high`), message |
| `LlmStreamEvent`  | token, confidence, done, traceId (SSE en tiempo real)                  |
| `LlmFeedback`     | suggestionId, útil/no útil, motivo opcional, usuario, timestamp             |

### Auditoría

| Entidad     | Campos clave                                                            |
|-------------|-------------------------------------------------------------------------|
| `AuditEvent`| id, created_at, tenant_id, user_id, action, service, model, model_version, prompt_version, trace_id, result, confidence, detail (JSON) |

- **UI:** `/app/audit` (`AuditEventsView`). Filtros en URL (`service`, `result`, `action`, `user_id`, `date_from`, `date_to`, `page`); tabla con fila expandible que muestra `trace_id`, versiones y el `detail` como JSON pre-formateado en `<pre>` (nunca como HTML). Paginación offset de 50 (sin `total` del backend: "Siguiente" solo si la página viene llena).
- **Exportación:** botón "Exportar CSV" (solo `audit:export`) que consulta el BFF con los filtros actuales y `limit: 200`, y descarga CSV con BOM UTF-8. Límite visible en la UI.
- **Permisos:** `audit:view` para `tenant_admin`/`platform_admin`/`supervisor`; `audit:export` solo `tenant_admin`/`platform_admin`. El rol "auditor" de la matriz no existe en la app.
- **BFF:** `/api/bff/audit/events` → `/audit/events` (existente en FastAPI), query params validados con Zod.

## Manejo de sesión y cookies

| Cookie          | HttpOnly | Secure | SameSite   | Path                       | Vida      |
|-----------------|----------|--------|------------|----------------------------|-----------|
| `access_token`  | sí       | sí     | Lax        | `/`                        | corta     |
| `refresh_token` | sí       | sí     | Strict     | `/api/bff/auth/refresh`    | larga     |
| `csrf_token`    | no       | sí     | Lax        | `/`                        | —         |

- **Renovación:** ante 401 del backend, el BFF intenta refresh una vez y reintenta la request; si falla, limpia sesión y devuelve estado expirado.
- **Logout:** revoca refresh en backend, borra cookies, limpia estado local y query cache sensible.
- **Cierre de sesión / cambio de tenant:** resetear el QueryClient para no reutilizar datos de otro tenant.

## Caché y fetching

- `no-store` en fetch server-side para datos sensibles. Nunca persistir query cache sensible en storage local (solo preferencias UI: tema, densidad, sidebar).
- TanStack Query con `staleTime` bajo en tickets, `refetchOnWindowFocus` selectivo.
- Query keys siempre con tenant:
  - `['tenant', tenantSlug, 'tickets', filters]`
  - `['tenant', tenantSlug, 'ticket', ticketId]`
  - `['tenant', tenantSlug, 'knowledge', filters]`
  - `['tenant', tenantSlug, 'audit', filters]`
- Streaming LLM: fetch con `ReadableStream` desde Route Handler (`/api/bff/llm/stream`) + `AbortController`; SSE con cancelación manual. Keys: `['tenant', tenantId, 'llm', 'stream']`.
- Paginación clásica en bandeja y auditoría; conversation thread carga últimos mensajes primero.
- Filtros en URL (search params) parseados con Zod.
- Reintentos: GET con backoff limitado; mutations sin retry automático; 401 → refresh; 403/404 sin retry.
- Invalidación post-mutación: responder → detalle + thread + actividad; estado/prioridad/asignación → lista + detalle; bulk → lista actual; artículo → lista KB + artículo.
- Optimistic updates con cautela (solo tags, feedback LLM y UI local sin riesgo).

## Middleware de Next.js

Liviano, no decide autorización fina:
- Detecta sesión activa.
- Redirige a `/login` sin sesión.
- Redirige a `/tenant/select` sin tenant activo.
- Protege rutas públicas si el usuario ya está autenticado.
- Valida estructura básica de `/tenant/[tenantSlug]`.

## Seguridad

- Protección por capas: proxy (ex middleware) → server guard → BFF → backend. La UI nunca es la única barrera.
- Tokens solo en cookies HttpOnly; nunca `localStorage` ni URL.
- PII enmascarada por defecto; revelado con permiso, motivo opcional y auditoría. Copia redactada, desalentar copia de PII.
- Prevención XSS: escape de React, sin `dangerouslySetInnerHTML` salvo sanitización explícita, CSP estricta, contenido del cliente siempre no confiable.
- Prompt injection: contenido del cliente tratado como input no confiable; si se sospecha, warning visible, confianza baja y bloqueo de apply automático.
- CSRF: cookies SameSite Lax/Strict + validación Origin/Referer en mutations.
- Auditoría de acciones sensibles desde frontend: login/logout, revelado de PII, exportación, sugerencias LLM aceptadas/rechazadas, feedback, cambios de configuración.

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
- **date-fns / dayjs** — utilidades de fechas.

## Paleta de colores

Tokens definidos en `ia-docs/desing/colors.md` (tema oscuro enterprise). Referencia de roles:

| Token          | Valor                 | Uso                             |
|----------------|-----------------------|---------------------------------|
| `--color-bark-900` | `#161F1A`         | Fondo de página                 |
| `--color-bark-800` | `#1E2923`         | Fondo de cards y paneles        |
| `--color-bark-700` | `#29342D`         | Superficie elevada, hovers      |
| `--color-bark-300` | `#97A29B`         | Texto secundario                |
| `--color-cream`    | `#EFEAE1`         | Texto principal                 |
| `--color-caramel-500` | `#D19A66`      | Acento (botones, badges)        |
| `--color-caramel-400` | `#DAA97A`      | Acento hover                    |

Colores semánticos (estados, prioridad, SLA, riesgo, LLM) también en `ia-docs/desing/colors.md`.
