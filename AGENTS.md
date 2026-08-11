# AGENTS.md - Web-app

Sistema SaaS multi-tenant de soporte, con agentes, supervisores, administradores, auditores, base de conocimiento, asistencia LLM responsable y fuerte énfasis en seguridad, PII, auditoría y prevención de fuga de información.

## Stack
- **Next.js App Router** (React + TypeScript estricto)
- **Tailwind CSS 4**
- **shadcn/ui** (new-york, tema neutral)
- **TanStack Query** — server state (listas, detalle, mutaciones, invalidaciones)
- **Zustand** — estado UI liviano (sesión, tenant activo, preferencias, selección)
- **React Hook Form + Zod** — formularios y validación
- **Lucide React** — íconos
- **ESLint + Prettier**
- **pnpm** como package manager

Backend: API externa **FastAPI** (fuente de verdad). El frontend habla con FastAPI **solo a través del BFF** (Route Handlers). No hay base de datos en el frontend.

## Comandos
- `pnpm dev` — arranca el entorno local
- `pnpm build` — compila para producción
- `pnpm start` — sirve el build de producción
- `pnpm lint` — revisa el estilo
- `pnpm typecheck` — chequeo de tipos de TypeScript

## Estructura del proyecto
```
src/
  app/                      # App Router: rutas (públicas, tenant, api/bff)
  components/
    ui/                     # shadcn/ui
    layout/                 # AppShell, Sidebar, Topbar, TenantSwitcher
    features/               # auth, tickets, llm, knowledge, admin, audit, shared
  hooks/                    # auth, tickets, knowledge, audit, llm
  lib/                      # api, auth, tenant, permissions, pii, audit, llm, validation, utils, constants
  stores/                   # session.store.ts, tenant.store.ts, ui.store.ts, ticket-selection.store.ts
  types/                    # auth, ticket, knowledge, audit, llm
  styles/                   # globals.css, themes.css
middleware.ts               # protección de rutas y tenant
```

Detalle completo en `ia-docs/init/arquitecture.md` (§ Estructura del proyecto).

## Convenciones
- Todo el contenido visible en español (argentino).
- Interfaces y modelos compartidos en `src/types/`.
- Reglas de arquitectura en `ia-docs/init/arquitecture.md`.
- Reglas de convenciones en `ia-docs/init/conventions.md`.
- Documentar cambios en `ia-docs/init/changes.md`.
- Los filtros viven en la URL; los tokens de sesión viven en cookies HttpOnly (nunca en JS).
- PII enmascarada por defecto; revelado solo con permiso y auditoría.
- Toda sugerencia LLM es editable; nunca se envía automáticamente.

## No hagas
- No instalar dependencias sin avisar.
- No usar `any` en TypeScript sin justificarlo.
- No llamar a FastAPI directamente desde el cliente; siempre vía BFF.
- No guardar tokens en `localStorage` ni exponerlos en URL.
- No usar `dangerouslySetInnerHTML` salvo necesidad explícita y sanitizada.
- No renderizar contenido del cliente como HTML confiable (prevenir XSS y prompt injection).
- No auto-ejecutar acciones basadas en salida del LLM.

## Herramientas
- **Context7**: Usar `context7_resolve-library-id` y `context7_query-docs` para consultar documentación actualizada de cualquier librería o framework antes de implementar.
- **frontend-design**: Usar la skill `frontend-design` para tareas de UI/visual. Cargar con `skill("frontend-design")` antes de diseñar o implementar componentes visuales.
- **react-best-practices**: Usar la skill `react-best-practices` al definir modelos de datos, props de componentes, respuestas de la API y contratos de validación.
- **typescript-best-practices**: Usar la skill `typescript-best-practices` para autocompletado, tipos estrictos y prevención de bugs silenciosos.
- **api-security-best-practices**: Usar la skill `api-security-best-practices` al definir la api.

## Flujo de trabajo
1. **Spec primero:** para cada feature, crear `ia-docs/features/NN-nombre/` con `spec.md`, `plan.md` y `tasks.md`. Esperar a que el usuario revise y dé OK antes de tocar código.
2. **Implementar solo con OK:** una vez aprobado el spec, implementar las tareas de `tasks.md` de a una.
3. **Una tarea a la vez; al terminar**, decir qué se cambió para que el usuario lo revise.
4. **Si no estás seguro al 80%,** preguntar. No inventar.
5. **Al terminar,** marcar las tareas en `tasks.md`, mover la feature a "Hecho" en `roadmap.md` y actualizar documentación.

## Documentación
- `ia-docs/constitution/` — misión, tech stack y roadmap (manda sobre todo).
- `ia-docs/init/` — spec, plan, arquitectura, convenciones, cambios.
- `ia-docs/desing/` — tokens de color y maquetas de UI.

## Datos de la app
- **Entorno:** Next.js App Router. Se mezclan Server Components (guards, layouts, datos poco interactivos) y Client Components (tablas, filtros, composer, panel LLM, formularios).
- **Arquitectura de red:** el navegador solo llama a rutas internas del BFF (`/api/bff/...`); el BFF (Route Handlers) llama a FastAPI con Authorization header y maneja cookies, refresh, CSRF, tenant y errores.
- **Sesión:** access/refresh token en cookies HttpOnly; el cliente solo recibe datos públicos de sesión.
- **Tenant:** URL scoping `/tenant/[tenantSlug]/...`; el backend valida membresía y permisos por tenant en cada operación.
- **Accesibilidad:** aria-labels, focus-visible, roles semánticos, contraste AA mínimo.

Cómo usarla:
1. **Antes de implementar**, leer `ia-docs/constitution/` para no contradecirla.
2. **Para una feature nueva**, crear `ia-docs/features/NN-nombre/` (siguiente número libre) con `spec.md` → `plan.md` → `tasks.md`.
3. **Esperar OK del usuario** antes de escribir código.
4. **Al terminar**, marcar las tareas en `tasks.md` y mover la feature a "Hecho" en `constitution/roadmap.md`.
5. La constitución manda: si una feature choca con `mission.md` o `tech-stack.md` (p. ej. pide un build o una dependencia) se replantea la feature, no la constitución.
