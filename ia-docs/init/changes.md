# Cambios

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
