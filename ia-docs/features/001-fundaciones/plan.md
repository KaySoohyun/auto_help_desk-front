# 001 · Fundaciones técnicas — Plan

## Enfoque

Construir la base siguiendo la arquitectura definida en `ia-docs/init/arquitecture.md`, adaptada al backend real (`ia-docs/backend/api.md`): BFF con Route Handlers, cookies HttpOnly, sesión en Zustand, rutas `/app/*` y un solo tenant por usuario.

## Decisiones técnicas

| Decisión | Detalle |
| --- | --- |
| Scaffolding | `create-next-app` con App Router, TypeScript, Tailwind 4, alias `@/`, `src/`. |
| shadcn/ui | `init` estilo new-york, base color neutral; componentes mínimos: button, input, label, card, sonner/toast, dropdown-menu, avatar, skeleton, separator. |
| ESLint + Prettier | Config de Next.js + Prettier alineado con el repo. |
| Entorno | `.env.local`: `BACKEND_URL` (fallback `http://localhost:8000`). Nunca exponer secretos. |
| BFF | Route Handlers en `src/app/api/bff/`. Solo el BFF llama a FastAPI con `Authorization: Bearer`. |
| Cookies | `access_token`: HttpOnly, Secure, SameSite=Lax, Path=/, 15 min. `refresh_token`: HttpOnly, Secure, SameSite=Strict, Path=/api/bff/auth. |
| Refresh | Ante 401 de FastAPI, el BFF intenta refresh una vez (rotación), re-usa cookies y reintenta la request. Si falla → limpia cookies y responde 401. |
| Tenant | `tenant_id` proviene de `GET /auth/me`. Sin slugs ni selector. |
| Middleware | Liviano: chequea cookie `access_token`. `/app/*` sin sesión → `/login`. `/login` con sesión → `/app`. Sin autorización fina. |
| Errores | `ApiError` (status, message, cause/validation). BFF traduce `{ detail }` de FastAPI. El cliente muestra mensajes amigables. |
| Query | TanStack QueryProvider en el layout raíz (para `me` y futuro server state). |

## Rutas

```
/login                            público — LoginForm
/app                              autenticado — layout (AppShell) + página placeholder (home)
/app/...                          futuro: tickets, knowledge, audit, admin, settings
```

## Pasos de implementación

1. Scaffolding Next.js + Tailwind + alias + ESLint/Prettier.
2. `shadcn init` + componentes base + tokens de color oscuro (`ia-docs/desing/colors.md`) en `globals.css`/`themes.css`.
3. Tipos: `src/types/auth.types.ts` (`UserOut`, `TokenResponse`, `SessionUser`, `SessionState`).
4. `src/lib/api/` — cliente fetch tipado hacia el BFF + `ApiError` + helpers de cookies (server-side).
5. BFF: `login`, `refresh`, `logout`, `me` (con refresco automático).
6. `src/stores/session.store.ts` (Zustand) con estados y persistencia en memoria (no storage sensible).
7. `src/hooks/auth/` — `useSession` / `useMe` (TanStack Query).
8. `proxy.ts` (ex `middleware.ts` en Next 16) — guard de rutas.
9. Login: `LoginForm` (RHF + Zod) + página `/login`.
10. AppShell: `Sidebar`, `Topbar` (usuario, rol, tenant, menú con logout), layout `/app`.
11. Página placeholder de `/app`.
12. Manejo de errores y estados (loading/error) base.
13. Cierre: build/lint/typecheck + documento `changes.md` y actualizo roadmap.

## Validación

- `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde.
- Probar contra FastAPI local (`BACKEND_URL=http://localhost:8000`): login, refresh (expirar access), me, logout.
