# Cambios

## 2026-08-11 — Feature 003 · Dashboard básico completada

- **DashboardPage** (`src/app/app/page.tsx`): página principal en `/app` que muestra KPIs (tickets asignados a mí, abiertos, sin asignar, SLA en riesgo) con grid de cards.
- **src/components/dashboard/KpiCard.tsx**: componente reusable de tarjeta KPI con título, valor y subtítulo.
- **src/components/dashboard/DashboardPage.tsx**: página principal con loading (skeleton cards), error state y filtros en URL `?status=&priority=`.
- **src/components/dashboard/DashboardFilters.tsx**: filtros por `status` y `priority` usando searchParams con Zod.
- **src/hooks/dashboard/useDashboard.ts**: hook TanStack Query con keys por tenant: `['tenant', tenantId, 'dashboard', filters]`.
- **src/types/dashboard.types.ts**: tipos `DashboardKpis` y `DashboardFilters`.
- **Ruta `/app`**: ahora muestra el dashboard completo en lugar del placeholder anterior. Fuera de alcance: LLM, gráficos avanzados, filtros por fecha, modo claro.

## 2026-08-12 — Feature 004 · Panel LLM base iniciada

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
