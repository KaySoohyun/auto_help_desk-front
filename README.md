# Auto Help Desk — Web

Frontend de la consola operativa de soporte **SaaS multi-tenant** donde los agentes resuelven tickets con base de conocimiento y asistencia LLM responsable. Seguridad, PII, auditoría y prevención de fuga de información son requisitos de primer orden.

- El backend **FastAPI** es la fuente de verdad; el frontend solo consume vía BFF.
- El **humano manda, el LLM sugiere**: toda sugerencia es un borrador editable, con confianza, fuentes y riesgos; nada se envía ni se ejecuta automáticamente.
- **PII enmascarada por defecto**; el contenido del cliente se trata siempre como no confiable.

## Features

- **Gestión de tickets** — bandeja con filtros en la URL, detalle con hilo de conversación, notas internas, SLA, prioridad, asignación, tags, cierre, alta de tickets.
- **Asistente LLM responsable** — clasifica, resume y sugiere respuestas (clasificar / resumir / sugerir respuesta / chat), streaming SSE, enmascarado de PII, niveles de confianza, banner de riesgos (baja confianza, alucinación, PII, prompt injection, contexto insuficiente) y feedback auditable.
- **Base de conocimiento** — artículos con flujo draft/published/archived, versionado, categorías y referencias desde el panel LLM.
- **Administración** — gestión de usuarios con RBAC, políticas de IA por tenant y globales, info del orquestador.
- **Auditoría** — tabla de eventos expandible con filtros en la URL, detalle JSON y export CSV.
- **Portal de personas (B2C)** — los clientes ven sus tickets, crean incidencias y conversan, aislados por tenant.
- **Multi-tenant real** — la membresía y los permisos se validan en el backend en cada operación.

## Stack

- **Next.js 16.3.0** (App Router) · **React 19** · **TypeScript estricto**
- **Tailwind CSS 4** + **shadcn/ui** (new-york, tema oscuro enterprise)
- **TanStack Query** (server state) + **Zustand** (estado UI liviano)
- **React Hook Form + Zod** (formularios y validación)
- **Lucide React** · **sonner** · **Vitest** (tests funcionales)
- **pnpm** como package manager

## Arquitectura

El navegador **nunca llama a FastAPI directamente**. Un Route Handler BFF (`/api/bff/*`) es el único punto de entrada al backend:

```
Browser → proxy.ts (guard de rutas y tenant) → /api/bff/* → FastAPI
```

- Sesión con **access/refresh token en cookies HttpOnly** (nunca en `localStorage` ni en la URL) y CSRF con double-submit.
- Refresco automático ante 401 (un solo reintento) y errores tipados con `correlationId`.
- `proxy.ts` (Next 16, ex `middleware.ts`) redirige según sesión y rol (`/app` vs `/panel`).
- Server Components para guards/layouts; Client Components para tablas, filtros, composer, panel LLM y formularios.

## Estructura

```
src/
  app/                 # Rutas del App Router
    (public)/          # Landing "/" + /personas/login + /empresas/login
    (personas)/        # Portal cliente: /panel, /panel/tickets/[ticketId]
    login/             # Login agentes/empresas
    app/               # Consola: tickets, knowledge, admin, audit (AppShell)
    api/bff/           # Route Handlers BFF (único acceso al backend)
  components/
    ui/                # shadcn/ui
    layout/            # AppShell, Sidebar, Topbar, PersonaShell
    features/          # auth, tickets, llm, knowledge, admin, audit, persona, shared
  hooks/               # Hooks TanStack Query por dominio
  lib/                 # api, auth, pii, llm, permissions, audit, constants, utils
  stores/              # session.store.ts, ui.store.ts (Zustand)
  types/               # Modelos compartidos (auth, ticket, knowledge, llm, audit...)
  styles/              # globals.css, themes.css
proxy.ts               # Protección de rutas y tenant
ia-docs/               # Constitución, specs, arquitectura, convenciones, design
tests/                 # Suite funcional (Vitest)
```

## Requisitos

- **Node.js 20+** y **pnpm 10+** (`corepack enable` si hace falta).
- Un backend **FastAPI** corriendo (por defecto en `http://localhost:8000`) con los usuarios seedeados (`scripts/seed_users.py` del backend).

## Configuración

Copiar `.env.example` a `.env` y ajustar:

| Variable | Default | Descripción |
|---|---|---|
| `URL_BACKEND_DEV` | `http://localhost:8000` | URL del backend FastAPI en desarrollo |
| `URL_BACKEND_PROD` | — | URL del backend FastAPI en producción |
| `ADMIN_EMAIL` | `platform-admin@example.com` | Credenciales `platform_admin` para tests funcionales |
| `ADMIN_PASSWORD` | `platform-admin-pass-123` | — |

Usuarios de prueba (tenant `test-tenant`): `agent@example.com` / `supervisor@example.com` / `tenant-admin@example.com` y `platform-admin@example.com` (sin tenant).

## Puesta en marcha

```bash
pnpm install
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000). La landing ofrece dos entradas: **Personas** (B2C) y **Empresas** (B2B). El login de agentes/empresas está en `/login`.

## Scripts

| Comando | Descripción |
|---|---|
| `pnpm dev` | Entorno local |
| `pnpm build` / `pnpm start` | Build y servidor de producción |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm format` / `pnpm format:check` | Prettier |
| `pnpm test:functional` | Levanta `next dev` en el puerto 3199, corre la suite Vitest y lo apaga |
| `pnpm test:functional:watch` | Vitest en modo watch |

## Tests

Suite funcional en `tests/` (Vitest, a nivel HTTP contra el BFF): auth, tickets, LLM, knowledge, admin, AI policy, auditoría, hardening (headers de seguridad, CSRF, 401, correlation-id), flujo de personas y flujo de empresas.

```bash
# Requiere el backend FastAPI corriendo en localhost:8000
pnpm test:functional
```

## Roles

`platform_admin` · `tenant_admin` · `supervisor` · `agent` · `customer`. La UI restringe acciones por rol, pero el backend es la autoridad final en cada operación.

## Documentación

- `ia-docs/constitution/` — misión, tech stack y roadmap.
- `ia-docs/init/` — spec, plan, arquitectura, convenciones, cambios.
- `ia-docs/desing/` — tokens de color y maquetas de UI.
- `ia-docs/backend/api.md` — referencia de la API del backend.
- `ia-docs/features/` — specs de features (spec → plan → tasks).