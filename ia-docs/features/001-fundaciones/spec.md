# 001 · Fundaciones técnicas

**Estado:** propuesta

## Qué hace

Pone en pie la base del frontend: proyecto Next.js + Tailwind + shadcn/ui, la capa BFF hacia FastAPI, la sesión con cookies HttpOnly, el login y el shell de la aplicación autenticada. Es la etapa 1.1 de la Fase 1 del `plan.md`.

## Por qué

Nada de lo siguiente (bandeja, detalle, dashboard, LLM, KB, admin) se puede construir sin auth, shell y arquitectura de red segura. Esta etapa fija los cimientos: estructura de carpetas, manejo de errores, sesión y layout.

## Contexto real del backend (contratos de `ia-docs/backend/api.md`)

- Login propio: `POST /auth/login` → `TokenResponse` (`access_token` 15 min, `refresh_token` 30 días con rotación).
- `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` → `UserOut`.
- El usuario tiene **un solo** `tenant_id` (string, nullable para admins). No existe tabla ni endpoint de tenants.
- Error estándar FastAPI: `{ "detail": "mensaje" }`.

## Decisiones de adaptación (aprobadas)

1. **Tenant real, no slugs:** el tenant llega en `UserOut.tenant_id`. No hay selector de tenants ni `TenantSwitcher`; se muestra el tenant actual en el topbar.
2. **Rutas autenticadas bajo `/app/*`**, sin `[tenantSlug]`.
3. **MFA solo preparado:** el modelo de sesión contempla `mfa_required`, pero no hay pantalla ni endpoint de MFA en esta etapa.
4. **Recuperación de contraseña fuera de alcance:** no existe endpoint en la API.

## Criterios de aceptación

- [ ] El proyecto compila con `pnpm build` y pasa `pnpm lint` y `pnpm typecheck`.
- [ ] Existe estructura de carpetas alineada a `arquitecture.md` (adaptada: `/app/*`, sin slug).
- [ ] El BFF expone al menos: `POST /api/bff/auth/login`, `POST /api/bff/auth/refresh`, `POST /api/bff/auth/logout`, `GET /api/bff/me`.
- [ ] Login con credenciales válidas contra FastAPI real guarda `access_token` y `refresh_token` en cookies HttpOnly (Secure, SameSite Lax/Strict) y muestra los datos de sesión.
- [ ] Credenciales inválidas muestran error inline en el formulario (401).
- [ ] Con sesión activa, `/login` redirige a `/app`; sin sesión, `/app/*` redirige a `/login`.
- [ ] `GET /api/bff/me` con access vencido intenta refresh una vez, rota cookies y responde; si el refresh también vence, limpia sesión y devuelve 401.
- [ ] Logout revoca el refresh en el backend y borra las cookies.
- [ ] `session.store.ts` refleja los estados: `unauthenticated`, `authenticating`, `authenticated`, `refreshing`, `expired`, `error` (y `mfa_required` preparado).
- [ ] AppShell (Sidebar + Topbar) muestra la sesión (usuario, rol, tenant) y se cierra sesión desde el menú de usuario.
- [ ] Los tokens nunca son accesibles desde JS ni aparecen en la URL.
- [ ] Tema visual oscuro aplicado con los tokens de `ia-docs/desing/colors.md`.
- [ ] Manejo de errores base: `ApiError` tipado y estados de loading/error/empty donde aplique.

## Fuera de alcance

- Bandeja, detalle de tickets, respuestas, dashboard con métricas (etapas 1.2 y 1.3).
- LLM, base de conocimiento, auditoría avanzada, administración.
- MFA funcional (solo estado preparado).
- Recuperación de contraseña (`/forgot-password`, `/reset-password`) hasta que exista endpoint.
- Registro público (`POST /auth/register`) — se evalúa como feature aparte.
- Selector de tenants y TenantSwitcher (el backend real tiene un tenant por usuario).
- Modo claro (solo oscuro).
