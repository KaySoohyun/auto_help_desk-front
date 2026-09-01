# Tech stack y convenciones

_Cómo está construido el proyecto y las reglas que todo el código debe respetar. Es la referencia técnica que ningún plan de feature debería contradecir._

## Tecnologías

- **Lenguaje:** TypeScript estricto (sin `any` sin justificar).
- **Framework / runtime:** Next.js App Router (React 19), Node.js 20+.
- **UI / estilos:** Tailwind CSS 4 + shadcn/ui (new-york, tema neutral) + Lucide React.
- **Estado:** TanStack Query (server state) + Zustand (estado UI liviano).
- **Formularios:** React Hook Form + Zod.
- **Base de datos:** no aplica. El backend externo FastAPI es la fuente de verdad; el frontend solo consume vía BFF.
- **Tests:** suite funcional con Vitest en `tests/` (`pnpm test:functional`, que levanta `next dev -p 3199` y corre `vitest run` contra el BFF+FastAPI local).
- **Despliegue:** a definir.

## Archivos / módulos clave

- `proxy.ts` (ex `middleware.ts`) — protección de rutas y tenant (sesión básica, sin autorización fina).
- `src/app/[slug]/` — rutas del App Router bajo slug de tenant: `app/*` (consola), `panel/*` (portal de personas), `empresas/login` y `personas/login`.
- `src/app/api/bff/` — Route Handlers que actúan como BFF hacia FastAPI (nunca se llama a FastAPI directo desde el cliente).
- `src/components/ui/` — componentes shadcn/ui (incluye `pagination.tsx`, `dialog.tsx`, etc.).
- `src/components/features/` — componentes de negocio por dominio (auth, tickets, llm, knowledge, admin, audit, shared).
- `src/components/layout/` — AppShell, Sidebar, Topbar, TenantSwitcher.
- `src/hooks/` — hooks custom por dominio (tickets, admin, auth, knowledge, audit, llm).
- `src/lib/` — api, auth, tenant, permissions, pii, llm, utils, constants, format, csrf.
- `src/stores/` — `session.store.ts` y `ui.store.ts` (estado UI liviano via Zustand).
- `src/types/` — auth, ticket, knowledge, audit, llm, admin, agent, customer, persona, tag, tenant.
- `src/styles/` — `themes.css` (tokens de color); `globals.css` vive en `src/app/`.
- `ia-docs/` — spec, plan, arquitectura, convenciones, cambios, constitution, design.

## Comandos

- `pnpm dev` — arranca el entorno local.
- `pnpm build` — compila para producción.
- `pnpm start` — sirve el build de producción.
- `pnpm lint` — revisa el estilo.
- `pnpm typecheck` — chequeo de tipos de TypeScript.

## Modelo de datos / dominio

- `Ticket` — estados `open|in_progress|on_hold|closed`; prioridad `urgent|high|medium|low`; flags PII/LLM/riesgo y `assignee {id,name,email,role}`.
- `Message` — cuerpo del cliente no confiable; `author_name` para display.
- `Article` — KB con estados `draft|published|archived` y versionado.
- `LlmSuggestion` — siempre borrador; con suggestionId, modelVersion, confidence, sources, riesgos.
- `AuditEvent` — usuario, acción, entidad, tenant, resultado; PII redactada según permiso.
- Invariantes: los filtros viven en la URL; los tokens de sesión en cookies HttpOnly; query keys con tenant (`['tenant', tenantId ?? 'global', ...]`).

## Convenciones

- camelCase para variables y funciones; PascalCase para componentes y tipos.
- Contenido visible en español (argentino); código, commits y tipos en inglés.
- Manejo de errores del BFF con formato `{ error: <string>, correlation_id? }` (ver `src/lib/api/authenticated.ts`).
- Validación con Zod: schemas definidos por ruta del BFF y por formulario (no hay capa compartida).
- Server Components para guards/layouts; Client Components para interacción.
- Todo acceso al backend vía `/api/bff/...`; nunca FastAPI directo.
- Documentar cada feature en `ia-docs/features/NN-nombre/` (spec → plan → tasks) antes de codear.

## Estilo visual

- Tema oscuro enterprise definido en `ia-docs/desing/colors.md` (tokens bark/cream/caramel + semánticos).
- Tokens de Tailwind siempre (`text-primary`, `bg-card`, `border-border`, etc.); sin valores hardcodeados.
- Colores semánticos para estados, prioridad, SLA, riesgo/PII y LLM.
- Tipografía: fuente de sistema para la consola operativa (sin fuentes display decorativas).
- Desktop-first; tablet usable con sidebar colapsada y panel LLM en drawer.

## Límites duros

- No añadir dependencias sin avisar.
- No usar `any` en TypeScript sin justificarlo.
- No llamar a FastAPI desde el cliente; siempre vía BFF.
- No guardar tokens en `localStorage` ni en la URL.
- No usar `dangerouslySetInnerHTML` salvo necesidad explícita y sanitizada.
- No auto-enviar ni auto-ejecutar sugerencias del LLM.
- No renderizar contenido del cliente como HTML confiable.
- No subir `.env*` ni secretos al repo.
- La UI oculta acciones pero nunca es la única barrera de autorización.
