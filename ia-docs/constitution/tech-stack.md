# Tech stack y convenciones

_Cómo está construido el proyecto y las reglas que todo el código debe respetar. Es la referencia técnica que ningún plan de feature debería contradecir._

## Tecnologías

- **Lenguaje:** TypeScript estricto (sin `any` sin justificar).
- **Framework / runtime:** Next.js App Router (React 19), Node.js 20+.
- **UI / estilos:** Tailwind CSS 4 + shadcn/ui (new-york, tema neutral) + Lucide React.
- **Estado:** TanStack Query (server state) + Zustand (estado UI liviano).
- **Formularios:** React Hook Form + Zod.
- **Base de datos:** no aplica. El backend externo FastAPI es la fuente de verdad; el frontend solo consume vía BFF.
- **Tests:** no hay suite configurada todavía (a definir en Fase 1).
- **Despliegue:** a definir.

## Archivos / módulos clave

- `middleware.ts` — protección de rutas y tenant (sesión básica, sin autorización fina).
- `src/app/` — rutas del App Router (públicas, tenant, `api/bff/*`).
- `src/app/api/bff/` — Route Handlers que actúan como BFF hacia FastAPI.
- `src/components/ui/` — componentes shadcn/ui.
- `src/components/features/` — componentes de negocio por dominio (auth, tickets, llm, knowledge, admin, audit, shared).
- `src/components/layout/` — AppShell, Sidebar, Topbar, TenantSwitcher.
- `src/hooks/` — hooks custom por dominio.
- `src/lib/` — api, auth, tenant, permissions, pii, audit, llm, validation, utils, constants.
- `src/stores/` — session.store.ts, tenant.store.ts, ui.store.ts, ticket-selection.store.ts.
- `src/types/` — auth, ticket, knowledge, audit, llm.
- `src/styles/` — globals.css, themes.css (tokens de color).
- `ia-docs/` — spec, plan, arquitectura, convenciones, cambios, constitution, design.

## Comandos

- `pnpm dev` — arranca el entorno local.
- `pnpm build` — compila para producción.
- `pnpm start` — sirve el build de producción.
- `pnpm lint` — revisa el estilo.
- `pnpm typecheck` — chequeo de tipos de TypeScript.

## Modelo de datos / dominio

- `Ticket` — estados `open|pending|waiting_customer|solved|closed`; prioridad `urgent|high|medium|low`; SLA `ok|at_risk|breached`; flags PII/LLM/riesgo.
- `Message` — tipo público/interno (nota); el contenido del cliente es no confiable.
- `Article` — KB con estados `draft|published|archived` y versionado.
- `LlmSuggestion` — siempre borrador; con suggestionId, modelVersion, confidence, sources, riesgos.
- `AuditEvent` — usuario, acción, entidad, tenant, resultado; PII redactada según permiso.
- Invariantes: los filtros viven en la URL; los tokens de sesión en cookies HttpOnly; query keys con tenant.

## Convenciones

- camelCase para variables y funciones; PascalCase para componentes y tipos.
- Contenido visible en español (argentino); código, commits y tipos en inglés.
- Manejo de errores con formato tipado `{ error: { code, message, details, correlationId } }`.
- Validación con Zod compartida entre formularios y BFF.
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
