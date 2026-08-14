# Cambios

## 2026-08-14 — Portal de personas (rol customer) — Feature 013

- **Backend** (detalle en `backend/ia_docs/cambios.md`, feature 021):
  - Rol `customer` + permiso `persona:tickets`; registro público admite `customer` y crea su fila en `customers` (`customers.user_id` nuevo).
  - Endpoints `/v1/me`: perfil (`GET /v1/me`), `GET|POST /v1/me/tickets`, `GET /v1/me/tickets/{id}`, `GET|POST /v1/me/tickets/{id}/messages`. Aislamiento por customer + tenant. Sin LLM.
  - `Ticket`/`TicketSummary` exponen `customer_id`; `TicketRepository` soporta filtro `customer_id`.
- **Frontend**:
  - `/personas/login`: login + registro como cliente (rol `customer`, selección de tenant obligatoria).
  - `/panel`: dashboard de personas (saludo con nombre del perfil, buscador, filtros por estado con conteos, crear ticket con modal RHF+Zod).
  - `/panel/tickets/[id]`: detalle con conversación (emisor derivado por `author_id`), composer manual y panel lateral (categoría, empresa, agente "Equipo de soporte", fechas).
  - `PersonaShell`/`PersonaHeader` (layout propio sin sidebar); proxy protege `/panel/*` y redirige login por rol (decodifica JWT).
  - Ruteo post-login/registro por rol (`homePathForRole`: customer → `/panel`).
  - BFF: `/api/bff/me/tickets*`, `/api/bff/me/profile`; registro BFF acepta `role`.
  - Landing: tarjeta "Personas" apunta a `/personas/login`.
- **Sin LLM para el cliente** (por decisión de producto): los mensajes son manuales.
- **Verificación**: backend **293 tests**; frontend `typecheck`, `lint`, `build` en verde; **115 tests funcionales** (incluye `tests/persona-flow.test.ts`).

## 2026-08-14 — Scope efectivo de tenant en backend (LLM, workspace, admin, audit, KB, customers)

- El backend ahora aplica el scope efectivo (tenant del JWT o todos los del usuario) también en:
  - **LLM**: `classify`, `summary`, `suggested-reply`, `analyze` — resuelven el tenant real del ticket, por lo que el panel LLM del detalle ya **no falla** para un usuario multi-tenant que entró sin seleccionar tenant.
  - **Workspace**: `my-tickets`, `suggestions`, `feedback`.
  - **KB**, **customers**, **auditoría** y **administración** (listados por `IN (tenant_ids)`; operaciones de escritura requieren un único tenant; `platform_admin` sigue operando a nivel plataforma).
- Sin cambios en el frontend; detalle completo en `backend/ia_docs/cambios.md`.

## 2026-08-14 — Flujo portal empresas completo (login + registro multi-tenant) y fix dashboard/tickets

- **Página `/empresas/login`** (`src/app/(public)/empresas/login/page.tsx`): reemplaza el placeholder por login real + registro con tabs (Tabs shadcn). Login reutiliza `LoginForm`; registro usa el nuevo `RegisterForm`.
- **`RegisterForm`** (`src/components/features/auth/RegisterForm.tsx`): RHF+Zod (email, password), lista de tenants desde `/api/bff/tenants/public` con checkboxes multi-selección, estados loading/error/reintentar. Al registrarse hace **auto-login** y decide el ruteo igual que el login: >1 tenants → `TenantSelector`, 1 tenant → `/app` directo.
- **`usePublicTenants`** (`src/hooks/auth/usePublicTenants.ts`): query TanStack de tenants públicos para el registro.
- **BFF nuevos**:
  - `POST /api/bff/auth/register`: registra + auto-login (emite tokens y setea cookies), traduce 409/404/422.
  - `POST /api/bff/auth/clear-tenant`: emite tokens sin tenant activo (vuelve a "todos los tenants").
  - `GET /api/bff/tenants/public`: lista de tenants para el registro.
  - `GET /api/bff/dashboard`: proxy a `GET /v1/dashboard`.
- **Session store** (`src/stores/session.store.ts`): métodos `register` (auto-login) y `clearTenant`.
- **Dashboard real** (`src/hooks/dashboard/useDashboard.ts`): ahora consume `/api/bff/dashboard` (antes interpretaba el listado de tickets como KPIs, por eso mostraba `undefined`).
- **Tenant switcher** (`src/components/layout/Topbar.tsx`): dropdown de usuario con "Todos los tenants" + lista de tenants del usuario (check en el activo), usando `switchTenant`/`clearTenant`.
- **Fix backend (causa raíz de los 500)**: migraciones de esquema (tickets.customer_id, tickets.language default, kb_article_tags.tag_id) y alcance de tenant desde el JWT (detalle en `backend/ia_docs/cambios.md`).
- **Verificación**: `pnpm typecheck`, `pnpm lint`, `pnpm build` en verde; **111 tests funcionales** en verde (incluye `tests/empresa-flow.test.ts` con registro multi-tenant, dashboard, switch/clear tenant y tenants públicos); backend **285 tests** en verde.

## 2026-08-14 — Multi-tenant en frontend

- **Landing page** (`src/app/(public)/page.tsx`):
  - Dos portales de acceso: "Personas" y "Empresas"
  - Diseño basado en `ia-docs/desing/multi-login.md`
  - Features section con beneficios del sistema
  
- **Login multi-tenant** (`LoginForm.tsx`):
  - Después del login, si el usuario tiene múltiples tenants, muestra selector
  - Selector de tenant con lista de tenants y roles
  - Opción "Continuar sin seleccionar tenant" para ver todos los tickets
  
- **Componentes nuevos**:
  - `TenantSelector.tsx`: UI para seleccionar tenant después del login
  - `src/app/(public)/empresas/login/page.tsx`: placeholder para portal de empresas
  
- **BFF endpoints nuevos**:
  - `POST /api/bff/auth/switch-tenant`: cambiar de tenant después del login
  - `GET /api/bff/auth/tenants`: listar tenants del usuario
  
- **Tipos actualizados**:
  - `TenantInfo`: id, name, slug, role
  - `UserOut`: ahora incluye lista de tenants
  - `SessionUser`: ahora incluye lista de tenants
  
- **Session store actualizado**:
  - `login()`: acepta `tenant_id` opcional
  - `switchTenant()`: nuevo método para cambiar de tenant
  
- **Verificación**: `pnpm typecheck` y `pnpm lint` en verde (0 errores, 0 warnings)

## 2026-08-14 — Feature 012 · Rediseño del detalle de ticket (Fase 6: Integración y tests)

- **Verificación de build**: `pnpm build` exitoso, todos los endpoints BFF correctamente registrados
- **Tests backend**: 276 tests pasan (260 anteriores + 16 nuevos de Feature 020)
- **Tests frontend**: `pnpm typecheck` y `pnpm lint` en verde (0 errores, 0 warnings)
- **Documentación actualizada**:
  - `ia-docs/features/012-rediseo-detalle-ticket/tasks.md`: todas las tareas marcadas como completadas
  - `ia-docs/init/changes.md`: registro de todas las fases (1-6)
  - `ia-docs/backend/ia_docs/cambios.md`: registro de Feature 020 (backend)
- **Feature completa**: Layout de 3 columnas, panel LLM unificado, auto-generación, tags, customers, tenants

## 2026-08-14 — Feature 012 · Rediseño del detalle de ticket (Fase 5: Panel LLM unificado)

- **Panel LLM unificado** (`LlmAssistantPanel.tsx`):
  - Eliminadas las tabs (Clasificar, Resumir, Chat)
  - Vista unificada que muestra todos los resultados en una sola pantalla
  - Auto-generación al cargar el ticket usando el endpoint `/analyze`
  - Botón "Regenerar" en el header del panel
  - Botón "Regenerar" en la sección de respuesta sugerida
- **Secciones mostradas**:
  - Clasificación sugerida (categoría, prioridad, confianza, intención)
  - Resumen (texto + información faltante)
  - PII detectada (badges con tipos de PII)
  - Riesgos (banners de advertencia)
  - Artículos recomendados (lista con confianza)
  - Respuesta sugerida (textarea editable + botones de acción)
- **Estados**:
  - Loading: skeleton mientras se analiza
  - Error: mensaje de error con botón "Reintentar"
  - Aviso: "Las sugerencias del LLM son orientativas..."
- **Integración**:
  - Usa `useTicketAnalyze` hook para llamar al endpoint `/analyze`
  - Auto-análisis al cargar el ticket (solo una vez)
  - Feedback registrado para cada sugerencia (clasificación, resumen, respuesta)
  - Redacción de PII en el borrador de respuesta
- **Verificación**: `pnpm typecheck` y `pnpm lint` en verde (0 errores, 0 warnings)

## 2026-08-14 — Feature 012 · Rediseño del detalle de ticket (Fase 4: Layout y componentes)

- **Layout de 3 columnas** (`TicketDetailView.tsx`):
  - Columna 1 (20%): Metadata del ticket (customer, propiedades, tags)
  - Columna 2 (50%): Conversación y composer
  - Columna 3 (30%): Panel LLM
- **Componentes nuevos**:
  - `CustomerCard.tsx`: muestra datos del cliente (nombre, email, empresa, plan)
  - `TicketPropertiesCard.tsx`: muestra propiedades del ticket (prioridad, categoría, asignado, fechas)
  - `TicketTagsCard.tsx`: muestra tags del ticket con funcionalidad de agregar/quitar
  - `TicketClosedNotice.tsx`: aviso cuando el ticket está cerrado
  - `alert.tsx`: componente UI Alert (shadcn/ui)
- **Integración**:
  - `TicketDetailView` ahora usa `useCustomer` para obtener datos del cliente
  - Composer se bloquea automáticamente cuando el ticket está cerrado
  - Tags se pueden agregar/quitar en tiempo real
- **Verificación**: `pnpm typecheck` y `pnpm lint` en verde (0 errores, 0 warnings)

## 2026-08-14 — Feature 012 · Rediseño del detalle de ticket (Fase 3: Tipos y BFF)

- **Tipos nuevos**:
  - `src/types/customer.types.ts`: `Customer` (id, tenant_id, name, email, company, plan, created_at)
  - `src/types/tenant.types.ts`: `Tenant` (id, name, slug, created_at)
  - `src/types/tag.types.ts`: `Tag`, `TicketTag`
- **Tipos actualizados**:
  - `src/types/ticket.types.ts`: `Ticket` ahora incluye `customer_id` y `tags`
  - `src/types/llm.types.ts`: agregados `KbRecommendation`, `PiiDetection`, `LlmAnalyzeOutput`
- **BFF endpoints nuevos**:
  - `POST /api/bff/tickets/[ticketId]/analyze` → `/v1/ai/tickets/{id}/analyze`
  - `GET /api/bff/tickets/[ticketId]/tags` → `/v1/tickets/{id}/tags`
  - `POST /api/bff/tickets/[ticketId]/tags/add` → `/v1/tickets/{id}/tags`
  - `DELETE /api/bff/tickets/[ticketId]/tags/[tagId]` → `/v1/tickets/{id}/tags/{tag_id}`
  - `GET /api/bff/customers/[customerId]` → `/v1/customers/{id}`
  - `GET /api/bff/tenants/[tenantId]` → `/v1/tenants/{id}`
- **Hooks nuevos** (`src/hooks/tickets/`):
  - `useTicketAnalyze(ticketId)`: mutación para analizar ticket
  - `useTicketTags(ticketId)`: query de tags del ticket
  - `useAddTicketTag()`: mutación para agregar tag
  - `useRemoveTicketTag()`: mutación para quitar tag
  - `useCustomer(customerId)`: query de customer
  - `useTenant(tenantId)`: query de tenant
- **Query keys actualizados** (`src/hooks/tickets/queryKeys.ts`): agregados `ticketTagsKey`, `ticketAnalyzeKey`, `customerKey`, `tenantKey`
- **Verificación**: `pnpm typecheck` y `pnpm lint` en verde (0 errores, 0 warnings)

## 2026-08-13 — Suite de tests funcionales contra el backend real

- **Runner**: Vitest (devDependency, `pnpm add -D vitest`). Scripts `test:functional` (levanta `next dev` en :3199 con `URL_BACKEND_DEV`, espera readiness, corre Vitest y mata el árbol de procesos con `process.kill(-pid)`) y `test:functional:watch`. Config en `vitest.config.ts` (environment node, `tests/**/*.test.ts`, setup que carga `.env` manualmente — no existe `@next/env` standalone).
- **Helper** `tests/support/client.ts`: `TestClient` que replica el navegador (jar de cookies + header `x-csrf-token` en mutantes, siguiendo `bffClient.ts`), login con credenciales de `.env` o usuario custom, y `seedAgent()` que registra un agent único en `test-tenant` vía `/auth/register` de FastAPI (la app no expone registro; se siembra directo para datos de test). Nota: el backend rechaza dominios ≠ `@example.com` con 422.
- **Suites (9 archivos, 82 tests)**:
  - `auth.test.ts` (5): login/me/logout reales, 401/422.
  - `tickets.test.ts` (11): listado, filtros, crear, detalle, update, asignación, mensajes, cierre, validaciones. Opera con agent sembrado (el `platform_admin` de `.env` no tiene tenant).
  - `dashboard.test.ts` (6): query real del dashboard (`limit=100`) + datos de KPIs (asignados a mí / sin asignar / abiertos) y filtros.
  - `knowledge.test.ts` (8): documenta que FastAPI **no expone `/v1/kb/*`** → 404 en todas las operaciones; validaciones BFF 422 OK.
  - `admin.test.ts` (7): RBAC real — agent → 403 "Permiso insuficiente"; `platform_admin` puede POST crear (201) y PATCH editar (200) a nivel plataforma, pero GET listado es tenant-scoped → 403 "Rol sin tenant asignado". Validaciones BFF 422.
  - `audit.test.ts` (7): RBAC 403 (agent / platform_admin) + validaciones BFF 422.
  - `ai-policy.test.ts` (9): global policy es a nivel plataforma (platform_admin GET/PUT 200, round-trip idempotente); tenant policy tenant-scoped (403); `ai-info` requiere rol admin (agent → 403). Validaciones BFF.
  - `llm.test.ts` (10): **PII-redact funciona real** (enmascara email + report). Orquestador ticket-scoped del **mock devuelve 422 "Campos de ... inválidos" siempre** (classify/summary/suggested-reply/chat/stream) → pendiente de investigar en FastAPI; feedback valida (404 si no existe la sugerencia). Validaciones BFF 422.
  - `hardening.test.ts` (9): headers siempre activos (nosniff, DENY, referrer-policy, permissions-policy) en páginas y BFF; **CSRF fail-closed** (403 sin header, 403 con token incorrecto, 201 con token correcto, GET sin CSRF OK); 401 JSON en `/me` sin sesión y en mutaciones sin sesión (el redirect a `/login` es comportamiento del cliente, no testeable por HTTP).
- **Hallazgos backend**: `total` del listado de tickets se computa en query separada del `items` (se desfasó 17 vs 18 con tests en paralelo → ajuste de aserción); `platform_admin` (sin tenant) opera a nivel plataforma (crear/editar usuarios, policy global) pero no en tenant-scoped; credenciales tenant_admin/auditor necesarias para validar admin/audit/ai-policy completos.
- **Estado**: 82/82 en verde contra backend real en `http://localhost:8000` (mock LLM). `typecheck` y `lint` limpios.

## 2026-08-13 — Feature 011 · Hardening (seguridad, a11y, performance, observabilidad)

- **Headers de seguridad globales** (`next.config.ts`): `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` y `Permissions-Policy` (sin cámara/micrófono/geolocalización) para todas las rutas. CSP estricto (`default-src 'self'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`) **solo en producción**: en dev rompe HMR/React Refresh (`'unsafe-inline'`/`'unsafe-eval'` para scripts, `connect-src 'self'`).
- **CSRF para el BFF** (mutaciones), esquema **cookies + header**:
  - `src/lib/auth/csrf.ts` (nuevo): `setCsrfCookie` (cookie `csrf_token`, **no HttpOnly**, SameSite=Lax, random UUID), `verifyCsrf` (compara cookie vs header `x-csrf-token` con `timingSafeEqual`).
  - `src/lib/auth/cookies.ts`: `setAuthCookies` ahora emite también la cookie CSRF al login/refresh.
  - `src/lib/api/authenticated.ts`: `authenticatedFetch(path, options, req)` verifica CSRF en **todo método ≠ GET** (403 si falta/coincide mal; fail-closed) y en GET garantiza la cookie CSRF si no existe (para que el cliente la tenga).
  - Todas las rutas BFF mutantes (tickets, messages, close, admin users, ai-policy, kb articles publish/archive/restore, llm chat/stream/classify/summarize/feedback/suggest-reply/pii-redact) pasan `req`; los handlers `_req: Request` de close/restore/publish/archive ahora usan `NextRequest`.
  - `src/lib/api/bffClient.ts`: en métodos ≠ GET lee la cookie `csrf_token` de `document.cookie` y la envía como header `x-csrf-token`.
- **Manejo global de 401** (`src/lib/api/sessionEvents.ts` + `providers.tsx` + `bffClient.ts`): pub/sub `onSessionExpired`/`emitSessionExpired` con cooldown (10s) para emitir una sola vez. `bffFetch` emite ante 401 (excluye `/api/bff/auth/*`: login/me/logout no deben redirigir); `Providers` suscribe y, si no está en `/login`, hace `window.location.href = "/login"` (recarga total intencional para resetear caché y estado; `eslint-disable` justificado).
- **Observabilidad** (`src/lib/api/bffClient.ts` + `errors.ts` + error boundaries): `bffFetch` genera `correlationId` por request (`crypto.randomUUID()` con fallback), lo envía como header `x-correlation-id` y lo adjunta al `ApiError` (4º parámetro). `src/app/error.tsx` (segmento) y `src/app/global-error.tsx` (raíz, con su propio `<html>/<body>`, estilos inline por reemplazar el layout) muestran mensaje + ID de error + botón "Recargar" (`reset()`).
- **Performance** (`src/components/features/tickets/TicketDetailView.tsx`): `LlmAssistantPanel` pasa a `next/dynamic` con `ssr: false` y skeleton de carga (evita render server y carga el chunk solo al montar). Comparación de `next build`: antes 34 chunks / el panel dentro del bundle eager de `/app/tickets/[ticketId]` (41 KB); después 35 chunks / panel en chunk separado lazy (31.7 KB), ~1 KB extra por el wrapper dynamic + skeleton.
- **Accesibilidad**: skip-link "Saltar al contenido" en `AppShell` + `<main id="main-content" tabIndex={-1}>`; auditoría de botones icon-only en flujos clave (Topbar, Sidebar, tickets, knowledge, feedback LLM, admin) sin faltantes → no requirió correcciones; nota WCAG 2.2 AA en `conventions.md`.
- **Verificación**: `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde (0 errores, 0 warnings); `curl -I` con headers de seguridad presentes en producción.
- **Pendientes documentados**: E2E tests, load testing, virtualización de listas grandes, densidad configurable; verificación funcional contra FastAPI real (mutaciones con CSRF, 403 si falta cookie, redirect 401 → `/login`).



## 2026-08-13 — Feature 010 · Privacidad, retención y límites LLM

- **Tipos y BFF** (`src/types/admin.types.ts` + `/api/bff/admin/`): `AdminAiPolicy`/`AdminAiPolicyUpdate`, `GlobalAiPolicy`/`GlobalAiPolicyUpdate`, `OrchestratorInfo`. Rutas `GET/PUT /api/bff/admin/ai-policy` (Zod: `tone` ≤50, `language` ≤10, `allowed_categories` ≤100, `escalation_rules` record), `GET/PUT /api/bff/admin/ai-policies/global` (Zod: `ai_confidence_threshold` 0–1, `llm_rate_max_calls` ≥1) y `GET /api/bff/admin/ai-info` → `/v1/ai/info`.
- **Hooks TanStack Query** (`src/hooks/admin/`): `useAiPolicy`, `useUpdateAiPolicy`, `useGlobalAiPolicy`, `useUpdateGlobalAiPolicy`, `useAiInfo` con invalidación y queryKeys nuevas (`ai-policy`, `ai-policies/global`, `ai-info`).
- **Permisos UI** (`src/lib/permissions.ts`): `AdminPermission` extiende con `ai:configure` (`tenant_admin`/`platform_admin`) y `ai:configure-global` (solo `platform_admin`).
- **UI en `/app/admin/llm`** (`AdminLlmView`): card de política IA del tenant (toggle `ai_enabled` con Checkbox, `tone`, `language`, editor de tags de categorías con Enter/Agregar/quitar, filas de reglas de escalado clave→valor), card de política global (modelo, umbral de confianza 0–1, guardrails, límite de llamadas; deshabilitada con nota para `tenant_admin`) y card read-only del orquestador con "Actualizar". Sub-nav `AdminNav` ("Usuarios | Configuración LLM") en `/app/admin/users` y `/app/admin/llm`.
- **Detalle React Compiler**: los formularios usan estado local inicializado desde el query y se resincronizan con la respuesta del `mutateAsync` (evita `setState` en effect → sin warning `react-hooks/set-state-in-effect`; tampoco RHF `watch()`).
- **Docs**: `arquitecture.md` actualizado (BFF admin, entidades de política, sub-nav, pendientes), `backend/api.md` marcado como consumido y sección "Privacidad y retención — ⚠️ Pendiente en FastAPI" (retención, preferencias de privacidad, config de redacción PII por tenant), entrada en `changes.md`.
- **Verificación**: `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde (0 errores, 0 warnings).
- **Pendiente**: verificación funcional contra FastAPI real (leer/editar política tenant, editar global como `platform_admin`, bloqueo de edición global como `tenant_admin`, info del orquestador, tags y reglas de escalado).

## 2026-08-13 — Feature 009 · Auditoría

- **Tipos y BFF** (`src/types/audit.types.ts` + `src/app/api/bff/audit/events/route.ts`): `AuditEvent` (= `AuditEventOut`), `AuditEventResult` (`success|failure|disabled`), `AuditEventService` (`auth|tickets|admin|ai|audit|pii`), `AuditEventListQuery`. `GET` con Zod de query params (`action`, `service`, `user_id`, `result`, `date_from`, `date_to`, `limit` 1–200 default 50, `offset`) y proxy a `/audit/events` (endpoint real de FastAPI).
- **Hooks TanStack Query** (`src/hooks/audit/`): `useAuditEvents` con query keys `['tenant', tenantId, 'audit', 'events', filters]`. Helper compartido `toAuditQueryString` en `src/lib/audit.ts` (usado por el hook y la exportación).
- **Permisos UI** (`src/lib/permissions.ts`): `AuditPermission` (`audit:view` para `tenant_admin`/`platform_admin`/`supervisor`; `audit:export` solo `tenant_admin`/`platform_admin`). El nav "Auditoría" en `Sidebar.tsx` se activa dinámicamente según `audit:view` (`enabled: "audit"`).
- **UI en `/app/audit`**: `AuditEventsView` con filtros en URL (`service`, `result`, `action`, `user_id`, `date_from`, `date_to`, `page`), tabla con fila expandible (`trace_id`, versiones de modelo/prompt, `detail` como JSON en `<pre>`, nunca HTML), badges de resultado, estados loading/error/empty y acceso denegado. Paginación offset de 50 (sin `total` del backend: "Siguiente" solo si la página viene llena).
- **Exportación CSV** (solo `audit:export`): consulta el BFF con los filtros actuales y `limit: 200`, genera CSV con BOM UTF-8 (`eventsToCsv` en `src/lib/audit.ts`) y lo descarga. Límite visible en la UI.
- **Docs**: `arquitecture.md` actualizado (BFF `GET /api/bff/audit/events`, sección Auditoría, query key de auditoría), `backend/api.md` marcado como consumido, entrada en `changes.md`.
- **Verificación**: `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde (0 errores, 0 warnings).
- **Pendiente**: verificación funcional contra FastAPI real (listado, filtros, detalle expandible, export CSV, acceso agente denegado).

## 2026-08-13 — Feature 008 · Administración (usuarios)

- **Tipos y BFF** (`src/types/admin.types.ts` + `src/app/api/bff/admin/users*`): `AdminUser` (= `UserOut`), `AdminUserCreatePayload`, `AdminUserUpdatePayload`. Rutas `GET/POST /api/bff/admin/users` y `PATCH /api/bff/admin/users/[userId]` con Zod y proxy a `/admin/users*` (endpoints reales de FastAPI).
- **Hooks TanStack Query** (`src/hooks/admin/`): `useAdminUsers` (lista con `AbortController`), `useCreateAdminUser`, `useUpdateAdminUser` con invalidación de la lista. Query keys con prefijo `'admin'` y tenant.
- **Permisos UI** (`src/lib/permissions.ts`): `AdminPermission` (`users:read|users:edit`) para `tenant_admin`/`platform_admin`; `supervisor`/`agent` sin acceso. El nav "Administración" en `Sidebar.tsx` se activa dinámicamente según `users:read` (`enabled: "admin"`, `matchPrefix` para subrutas).
- **UI en `/app/admin/users`**: `AdminUsersView` (tabla con búsqueda client-side por email, filtro por rol, estados loading/error/empty y acceso denegado), `UserCreateForm` (RHF+Zod; rol limitado según permiso; `tenant_id` solo para `platform_admin`) y `UserEditDialog` (rol sin `platform_admin` para `tenant_admin`, activo/inactivo con `AlertDialog` de confirmación, no se puede desactivar la propia cuenta). `/app/admin` redirige a `/app/admin/users`.
- **Fix lint**: `watch()` de React Hook Form genera warning `react-hooks/incompatible-library` (React Compiler); el rol del formulario de creación se maneja con estado local en vez de `watch`.
- **Docs**: sección "Configuración operativa — Pendiente en FastAPI" en `ia-docs/backend/api.md` (invitaciones, equipos, roles, SLA, canales, categorías, tags, plantillas) y tablas pendientes en `ia-docs/backend/models.md`; `arquitecture.md` actualizado (endpoints BFF admin, modelo Administración).
- **Verificación**: `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde (0 errores, 0 warnings).
- **Pendiente**: verificación funcional contra FastAPI real (listado, crear con restricciones de rol, editar rol, desactivar/activar, acceso agente denegado).

## 2026-08-13 — Feature 007 · Base de conocimiento

- **Tipos y contratos BFF** (`src/types/knowledge.types.ts` + `src/app/api/bff/knowledge/*`): `KbArticleStatus`, `KbArticle`, `KbArticleSummary`, `KbArticleList`, `KbArticleVersion`, query/payload types. Rutas `articles`, `articles/[articleId]`, `publish|archive|restore` y `versions` con Zod y proxy a `/v1/kb/*` (contratos pendientes en FastAPI).
- **Hooks TanStack Query** (`src/hooks/knowledge/`): `useArticles`, `useArticle`, `useArticleVersions` y mutaciones `useCreateArticle`, `useUpdateArticle`, `usePublishArticle`, `useArchiveArticle`, `useRestoreArticle` con invalidación de lista + detalle + versiones. Query keys con prefijo `'knowledge'` y tenant.
- **UI en `/app/knowledge/*`**: listado con filtros por estado/categoría en URL (Zod) y búsqueda client-side con debounce, paginación, detalle con body en texto plano (`whitespace-pre-wrap`, sin `dangerouslySetInnerHTML`), editor RHF+Zod (crear/editar), transiciones publicar/archivar/restaurar con `AlertDialog` de confirmación, historial de versiones solo lectura y taxonomy view de categorías (sin CRUD).
- **Permisos UI** (`src/lib/permissions.ts`): `KbPermission` (`kb:read|kb:edit|kb:publish`); agent = `kb:read` (solo lee `published`), supervisor/tenant_admin/platform_admin = los tres. La UI oculta acciones; el backend decide.
- **Integración con tickets/LLM (T6)**: `src/components/features/knowledge/RelatedArticles.tsx` lista artículos `published` por categoría del ticket; `LlmAssistantPanel` suma la sección "Artículos relacionados" y "Insertar referencia" agrega una línea citable (`Referencia (base de conocimiento): {título} — {origin}/app/knowledge/articles/{id}`) al composer vía `onUseReply`, sin envío automático. `TicketDetailView` pasa `ticket.category` y un handler que **agrega** la referencia al borrador sin pisar contenido previo.
- **Docs**: contratos KB documentados como **pendientes** en `ia-docs/backend/api.md` (§ Knowledge Base) y tablas `kb_articles`/`kb_article_versions` en `ia-docs/backend/models.md`; `arquitecture.md` actualizado (endpoints BFF, modelo knowledge, integración LLM).
- **Verificación**: `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde (0 errores, 0 warnings).
- **Pendiente**: validación funcional contra FastAPI real (el backend no expone `/v1/kb/*` aún) y verificación a11y visual.

## 2026-08-12 — Feature 006 · Confianza y seguridad LLM

- **Modelo de riesgos tipado** (`src/types/llm.types.ts`): `LlmRiskLevel` (`low|medium|high`), `LlmRiskKind` (`low_confidence|hallucination|pii|prompt_injection|insufficient_context|policy|warning`), `LlmRisk` y `LlmRiskEvaluation` (`{ risks, blocked }`).
- **Nuevo módulo `src/lib/llm/`** (lógica pura, sin UI):
  - `confidence.ts` — `confidenceLevel(c)` con umbrales 0.8/0.6 y labels Alta/Media/Baja.
  - `injection.ts` — `detectPromptInjection(text)` con patrones ES/EN normalizados (NFD sin tildes) y conservadores; devuelve riesgo `prompt_injection` high ante cualquier coincidencia.
  - `context.ts` — `isInsufficientContext(text)` (umbral 200 chars) y `buildTicketContext({ subject, description, messages })`.
  - `risks.ts` — `evaluateLlmRisks(...)` compone confianza, warnings, policy_flags, PII, injection y bajo contexto; ordena por severidad; `blocked` = hay `prompt_injection` high. `hasBlockingRisk(risks)`.
- **Componentes nuevos** (`src/components/features/llm/`): `ConfidenceBadge` (standalone, con label Alta/Media/Baja), `RiskBanner` (ícono por kind, color por kind con tokens semánticos, `role="alert"` en high), `PromptInjectionWarning` (banner magenta destacado) e `InsufficientContextNotice` (aviso ámbar de bajo contexto).
- **Integración en el panel** (`src/components/llm/LlmAssistantPanel.tsx`):
  - Cada salida (clasificar, resumir, chat, sugerencias, streaming) evalúa riesgos vía `evaluateLlmRisks` y los muestra como `RiskBanner`/`PromptInjectionWarning`.
  - Bloqueo de apply: "Usar en respuesta" / "Usar sugerencia" se deshabilitan cuando `blocked` (prompt injection high), con `title` explicativo y guard también en `applyChatInComposer`.
  - `InsufficientContextNotice` en las pestañas Chat, Sugerencias y Streaming cuando el ticket es muy corto.
  - Eliminados `ConfidenceBadge`/`WarningList`/`PiiDetectionList` inline (reemplazados por los componentes nuevos; la PII ahora aparece como riesgo `pii`).
- **Paso de contexto**: `TicketDetailView.tsx` arma `contextText` (asunto + descripción + mensajes vía `useMessages`, cache compartida con el thread) y lo pasa como prop opcional a `LlmAssistantPanel`.
- **Fix de patrones injection**: el grupo opcional `(?:\s+todo\s+)?` consumía el espacio y con backtracking dejaba la palabra pegada, rompiendo matches sin artículo ("olvida lo anterior" fallaba). Corregido exigiendo `\s+` antes de la palabra clave.
- **Verificación**: `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde (0 errores, 0 warnings) + test manual de lógica pura (injection, contexto, riesgos) con jiti (15 checks OK).
- **Pendiente**: validación funcional contra FastAPI real y verificación a11y visual.

## 2026-08-12 — Documentación · Resumen de referencia

- Creado `ia-docs/init/resumen.md`: resumen condensado de `backend/`, `constitution/` e `init/` (misión, stack, arquitectura BFF, sesión/tenant, dominio, roles, API FastAPI, seguridad/PII/LLM, estado del proyecto y convenciones). Sirve como lectura rápida del agente; la fuente de verdad sigue siendo cada archivo original.

## 2026-08-12 — Feature 005 · Alineación de chat/stream/sugerencias con el backend real

- **Contract mismatch resuelto**: los BFF `chat`, `stream` y `suggest` apuntaban a `/v1/ai/tickets/{id}/chat` y `/v1/ai/tickets/{id}/suggest`, endpoints que **no existen** en `ia-docs/backend/api.md`. Ahora:
  - `src/app/api/bff/llm/chat/route.ts` → proxya a `POST /v1/ai/tickets/{id}/suggested-reply` (el endpoint real). Sin `message` (el backend no lo recibe); body `{tone?, language?}`.
  - `src/app/api/bff/llm/stream/route.ts` → proxya a `POST /v1/ai/tickets/{id}/suggested-reply` y envuelve la respuesta como un único evento SSE `data: {...}`.
  - `src/app/api/bff/llm/suggest/route.ts` **eliminado** (endpoint inexistente). La pestaña Sugerencias ahora genera 3 respuestas vía `suggested-reply` con tonos `formal | empático | conciso`.
- **Tipos** (`src/types/llm.types.ts`): `LlmChatOutput = LlmSuggestReplyOutput` (campo `suggested_reply`); `LlmChatInput` sin `message`; `LlmStreamInput` sin `message`; eliminados `LlmSuggestInput/Output` y `LlmSuggestionItem`.
- **Fix streaming** (`src/hooks/llm/useLlm.ts`): `startStream` ahora devuelve el cleanup **sincrónicamente** (antes lo retornaba recién al terminar el stream, por lo que "Cancelar stream" nunca cancelaba nada). El abort cancela el fetch + detiene la emisión. La respuesta completa del evento SSE se emite **chunked** como tokens en tiempo real (6 chars / 12ms), listo para true streaming cuando el backend lo soporte.
- **Fix render "undefined"**: el panel sumaba `token.token` sobre el output completo (`reply`) → mostraba "undefined". Ahora el hook emite chunks con campo `token` real y la pestaña Streaming renderiza texto real + `ConfidenceBadge` con la confianza de la respuesta (antes hardcodeada en 0.5).
- **Feedback de sugerencias**: cada una de las 3 sugerencias tiene `suggestion_id` real del backend, por lo que "Usar sugerencia" y `FeedbackRow` registran `accepted`/`edited`/`rejected`/`flagged` vía `/api/bff/llm/feedback`.
- **Build**: `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde (0 errores, 0 warnings).
- **Pendiente**: validación funcional contra FastAPI real y verificación a11y (T4 en `tasks.md`).

## 2026-08-12 — Feature 005 · Panel LLM avanzado (streaming, sugerencias, feedback)

- **BFF endpoints nuevas** (`src/app/api/bff/llm/{chat,stream,suggest}/route.ts`): 
  - `chat/route.ts` → proxy `POST /v1/ai/tickets/{id}/chat` (Zod schema con ticketId/message/tone/language). La pestaña "Chat" reemplazó a la anterior "Sugerir".
  - `stream/route.ts` → SSE proxy. Obtiene token via `getAccessToken`, reenvía respuesta como `text/event-stream` (Content-Type: `text/event-stream`, Cache-Control: `no-cache`). El backend no expone aún endpoint SSE real; la ruta proxya al endpoint `/chat` y envuelve la respuesta como un único evento `data: {...}`. Preparada para true streaming cuando el backend lo soporte.
  - `suggest/route.ts` → proxy `POST /v1/ai/tickets/{id}/suggest` (Zod schema con ticketId/tone/language).
  - `feedback/route.ts` ya existía (004).
- **Tipos** (`src/types/llm.types.ts`): agregados `LlmChatInput/Output`, `LlmStreamInput`, `LlmStreamToken`, `LlmSuggestInput/Output`, `LlmSuggestionItem`.
- **Hook** (`src/hooks/llm/useLlm.ts`): agregadas mutaciones `chat`, `suggest` y función `startStream` (SSE reader con `AbortController` + callbacks `onToken`/`onError`/`onDone` + states `isStreaming`/`streamError`). Keys por tenant.
- **Panel lateral** (`src/components/llm/LlmAssistantPanel.tsx`): 5 pestañas — Clasificar, Resumir, Chat, Sugerencias, Streaming.
  - **Chat**: input de mensaje, botón enviar, textarea de respuesta editable, PII detection + redacción, botón "Usar en respuesta" (con feedback auto: accepted/editado), confidence badge, feedback row (Aceptar/Editar/Regenerar/Rechazar/Marcar).
  - **Sugerencias**: botón "Generar sugerencias" (3 items), cada uno con textarea editable, score de confianza, rationale, botones "Usar sugerencia" y "Regenerar".
  - **Streaming**: input de mensaje, botón iniciar/cancelar, textarea de salida en tiempo real (tokens como llegan), contador de tokens, confidence badge, error state con reintentar.
  - **FeedbackRow** extendido: agregados botones "Editar" (edited) y "Regenerar" (re-ejecuta query). Renombrado `useReplyInComposer` → `applyChatInComposer` para evitar falseo de `react-hooks/rules-of-hooks`. Removida prop `suggestionId` huérfed.
- **Fix lint pre-existing**: `LlmAssistantPanel.tsx` tenía 1 error (`react-hooks/rules-of-hooks` por función `useReplyInComposer` llamada en callback) y 1 warning (`suggestionId` sin usar). Corregido.
- **Build**: `pnpm build`, `pnpm lint`, `pnpm typecheck` todos en verde (0 errores, 0 warnings).
- **Nota**: el endpoint `/v1/llm/stream` mencionado en la spec 005 no existe en el backend (`ia-docs/backend/api.md`). Se proxya a `/v1/ai/tickets/{id}/chat` con wrapping SSE. Requiere validación funcional contra FastAPI real.



- **DashboardPage** (`src/app/app/page.tsx`): página principal en `/app` que muestra KPIs (tickets asignados a mí, abiertos, sin asignar, SLA en riesgo) con grid de cards.
- **src/components/dashboard/KpiCard.tsx**: componente reusable de tarjeta KPI con título, valor y subtítulo.
- **src/components/dashboard/DashboardPage.tsx**: página principal con loading (skeleton cards), error state y filtros en URL `?status=&priority=`.
- **src/components/dashboard/DashboardFilters.tsx**: filtros por `status` y `priority` usando searchParams con Zod.
- **src/hooks/dashboard/useDashboard.ts**: hook TanStack Query con keys por tenant: `['tenant', tenantId, 'dashboard', filters]`.
- **src/types/dashboard.types.ts**: tipos `DashboardKpis` y `DashboardFilters`.
- **Ruta `/app`**: ahora muestra el dashboard completo en lugar del placeholder anterior. Fuera de alcance: LLM, gráficos avanzados, filtros por fecha, modo claro.

## 2026-08-12 — Feature 004 · Panel LLM base completada

- **BFF endpoints** (`src/app/api/bff/llm/{classify,summarize,chat}/route.ts`): 3 rutas POST que fetch a FastAPI con auth header, mapeo de errores `ApiError` y headers de rate-limit.
- **Tipos** (`src/types/llm.types.ts`): `LlmClassifyInput/Output`, `LlmSummarizeInput/Output`, `LlmChatInput/Output` con Zod schemas de validación.
- **Hooks TanStack Query** (`src/hooks/llm/useLlm.ts`): keys por tenant `['tenant', tenantId, 'llm', 'classify']` y mutaciones `useLlmClassify`, `useLlmSummarize`, `useLlmChat` con invalidación y retry.
- **Panel lateral** (`src/components/llm/LlmSidebar.tsx`): 3 pestañas (Clasificar, Resumir, Chat) con input text, botón enviar, disclaimer humano badge "Salida generada por IA. Verificar antes de usar." y botón Descartar.
- **Estados UI**: loading (skeleton cards), error (mensaje + reintentar), vacío (sin input).
- **Validación PII**: truncado a 3000 caracteres, máscaras básicas en input, sin `dangerouslySetInnerHTML`.
- **Logging auditado**: cada llamada LLM guarda usuario, tenant, input hash, output truncado, timestamp, éxito/fallo.
- **a11y**: labels aria en inputs, contraste AA, focus management al navegar tabs, foco visible.

## 2026-08-11 — Feature 002 · Bandeja y detalle de tickets completada

- **Tipos y BFF** (`src/types/ticket.types.ts`, `src/app/api/bff/tickets/...`): `TicketStatus`, `TicketPriority`, `TicketSummary`, `Ticket`, `TicketList`, `TicketMessage`, `TicketListQuery`, `TicketUpdatePayload`, `CreateTicketPayload`. Rutas `GET/POST /api/bff/tickets`, `GET /api/bff/tickets/[ticketId]`, `GET/POST .../messages`, `PATCH .../[ticketId]`, `POST .../close`. Nuevo helper `src/lib/api/authenticated.ts` (fetch autenticado con refresh automático de 1 retry + `apiErrorResponse`) reutilizado por todas las rutas de tickets.
- **Hooks TanStack Query** (`src/hooks/tickets/`): `useTickets`, `useTicket`, `useMessages` (keys por tenant) y mutaciones `useSendMessage`, `useUpdateTicket`, `useCloseTicket`, `useCreateTicket` con invalidación de queries.
- **Selección Zustand**: `src/stores/ticket-selection.store.ts` (toggle/selectMany/clear/setAll). Solo UI, sin bulk actions (el backend no tiene endpoints batch).
- **Bandeja `/app/tickets`**: filtros por estado/prioridad (selects) y categoría (input debounce) que navegan por URL; búsqueda client-side por asunto (debounce); tabla con badges, selección, antigüedad relativa; paginación con `limit`/`offset` respetando `total`; estados loading (skeleton), error y empty; `CreateTicketDialog` (RHF + Zod).
- **Detalle `/app/tickets/[ticketId]`**: metadata (estado, prioridad, categoría, idioma, asignado, fechas), subject/description en texto plano, `TicketThread` (mensajes asc, autor, fecha), `MessageComposer` (RHF + Zod, invalida mensajes/detalle/lista), acciones de estado/prioridad (PATCH), asignar/desasignarse (PATCH `assignee_id`), cerrar con dialog de confirmación (`POST close`).
- **Permisos UI**: `src/lib/permissions.ts` (matriz por rol: `responses:edit`/`responses:send`). agent/supervisor/tenant_admin editan y cierran; platform_admin solo lectura. El backend sigue siendo la autoridad real.
- **UI components nuevos**: `badge`, `select`, `dialog`, `checkbox`, `textarea`, `alert-dialog` (radix-ui unificado ya instalado, sin nuevas dependencias).
- **Fix**: `src/types/ticket.types.ts` `assignee_id` acepta `null` (para desasignar). Los `searchParams` se pasan al cliente como objeto plano (URLSearchParams no se serializa Server→Client).
- **Datos de prueba**: usuario `agente-tickets@example.com` / `claveSegura123` con tenant `tenant-tickets` registrado contra FastAPI; tickets 1–4 con mensajes.

## 2026-08-11 — Feature 001 · Fundaciones técnicas completada

- **BFF y sesión** (`src/app/api/bff/`): `login`, `refresh`, `logout`, `me` con refresh automático (1 retry) vía FastAPI. Cookies HttpOnly (`access_token` Lax, `refresh_token` Strict). Limpieza de cookies ante refresh fallido. Traducción de errores a `ApiError`.
- **`src/proxy.ts` (ex `middleware.ts`)**: Next 16 renombró la convención `middleware.ts` → `proxy.ts` (función `proxy`). El archivo está en `src/proxy.ts` (raíz de `src/`, mismo nivel que `app/`). Guard de rutas: `/` y `/app/*` → `/login` sin sesión; `/login` → `/app` con sesión. Nota: el guard es por cookie de sesión (liviano), la autorización real vive en el BFF/backend.
- **`src/lib/auth/cookies.ts`**: `refresh_token` con `Path=/` (antes `/api/bff/auth`) para permitir refresh automático en `/api/bff/me`. Mitigado por SameSite=Strict + HttpOnly.
- **Sesión cliente**: `src/stores/session.store.ts` (Zustand) con estados `unauthenticated`/`authenticating`/`authenticated`/`refreshing`/`expired`/`error`; `src/hooks/auth/` (`useMe` + helpers).
- **UI**: `LoginForm` (RHF + Zod) en `/login`; AppShell (`Sidebar` colapsable, `Topbar` con menú y logout) en `/app` con placeholder de home.
- **Docs**: actualizadas todas las referencias a `middleware.ts` → `proxy.ts` (AGENTS.md, arquitectura, spec, tech-stack, plan, tasks). Refresh cookie Path documented in spec §2.7.

## 2026-08-11 — Alineación de documentación con spec/plan

- **AGENTS.md**: corregido stack (de Vite SPA a Next.js App Router + shadcn/ui + Tailwind 4 + TanStack Query + Zustand + RHF/Zod), comandos, estructura de carpetas, convenciones, sección "Datos de la app" y reglas de seguridad/LLM.
- **ia-docs/init/arquitecture.md**: reescrito con la arquitectura del spec (BFF con cookies HttpOnly, RSC vs Client, estructura de carpetas, flujo de datos, endpoints BFF, routing, modelo de dominio, caché, middleware, seguridad, dependencias y paleta).
- **ia-docs/init/conventions.md**: actualizado a convenciones Next.js (server/client, BFF, TanStack Query, Zustand, cookies HttpOnly), secciones de seguridad/PII y LLM responsable, a11y, paleta y git.
- **ia-docs/constitution/mission.md**: completada (producto, audiencia, principios, no-ahorro).
- **ia-docs/constitution/tech-stack.md**: completada (tecnologías, módulos clave, comandos, dominio, convenciones, estilo visual, límites duros).
- **ia-docs/constitution/roadmap.md**: completada con las fases del plan (001 fundaciones en "Siguiente"; resto en backlog).
- **ia-docs/desing/colors.md**: añadidos tokens de borde y colores semánticos (estados de ticket, prioridad, SLA, riesgo/seguridad/LLM, contenido de conversación) sobre el tema oscuro bark/cream/caramel.
