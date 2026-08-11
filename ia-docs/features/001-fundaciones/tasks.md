# 001 · Fundaciones técnicas — Tasks

Estado: completado (verificado con build, lint, typecheck y pruebas de sesión).

## T1 · Scaffolding y configuración

- [x] Crear proyecto Next.js (App Router, TypeScript, Tailwind 4, alias `@/`, `src/`).
- [x] Configurar ESLint + Prettier.
- [x] `.env.local` con `BACKEND_URL` (fallback `http://localhost:8000`) + `.env.example`.
- [x] `shadcn init` (new-york, neutral) e instalar componentes base (button, input, label, card, dropdown-menu, avatar, skeleton, separator, sonner).
- [x] Aplicar tokens de `ia-docs/desing/colors.md` (tema oscuro) en `globals.css`/`themes.css`.

## T2 · Tipos y capa de red

- [x] `src/types/auth.types.ts`: `UserOut`, `TokenResponse`, `SessionUser`, `SessionState`.
- [x] `src/lib/api/errors.ts`: `ApiError` tipado (status, message, detail).
- [x] `src/lib/api/client.ts`: fetch tipado hacia el BFF con timeout y headers.
- [x] `src/lib/auth/`: helpers de cookies (set/clear access y refresh) server-side.

## T3 · BFF (Route Handlers)

- [x] `POST /api/bff/auth/login`: llama `POST /auth/login` de FastAPI, setea cookies HttpOnly, devuelve sesión.
- [x] `POST /api/bff/auth/refresh`: rota tokens vía `POST /auth/refresh`.
- [x] `POST /api/bff/auth/logout`: revoca `POST /auth/logout` y borra cookies.
- [x] `GET /api/bff/me`: `GET /auth/me` con refresh automático (1 retry) y limpieza de sesión si expira.
- [x] Traducción de errores de FastAPI a `ApiError`.

## T4 · Sesión y hooks

- [x] `src/stores/session.store.ts` (Zustand): estados `unauthenticated`, `authenticating`, `authenticated`, `refreshing`, `expired`, `error` (+ `mfa_required` preparado).
- [x] `src/stores/ui.store.ts`: preferencias mínimas (sidebar colapsada).
- [x] `src/hooks/auth/useMe.ts` y helpers de login/logout.

## T5 · Middleware y rutas

- [x] `src/proxy.ts` (ex `middleware.ts`, renombrado en Next 16): guard de `/app/*` → `/login` sin sesión y `/login` → `/app` con sesión.
- [x] Página `/login`.
- [x] Layout autenticado `/app` (AppShell) + página placeholder de home.

## T6 · AppShell

- [x] `Sidebar` (navegación del tenant, colapsable).
- [x] `Topbar` (usuario, rol, tenant actual, menú con logout).
- [x] `LoginForm` (React Hook Form + Zod) con error inline para 401.
- [x] Logout desde el menú de usuario.

## T7 · Estados y cierre

- [x] Estados loading/error base en login y home.
- [x] `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde.
- [x] Documentar en `ia-docs/init/changes.md`.
- [x] Mover 001 a "Hecho" en `ia-docs/constitution/roadmap.md`.
