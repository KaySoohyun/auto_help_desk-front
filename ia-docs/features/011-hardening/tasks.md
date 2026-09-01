# Feature 011 · Hardening — Tasks

## T1 · Headers de seguridad

- [x] `next.config.ts`: `headers()` con `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` y CSP (solo producción).

## T2 · CSRF hardening

- [x] `src/lib/auth/csrf.ts`: `getCsrfToken()`, `setCsrfCookie()` (cookie no HttpOnly, SameSite=Lax, Secure prod, path=/), `verifyCsrf(req)`.
- [x] `setAuthCookies` setea `csrf_token` en login/refresh.
- [x] `authenticatedFetch`: métodos != GET verifican header `x-csrf-token` == cookie (si no → 403); GET sin cookie la setean en la respuesta.
- [x] `bffFetch`: lee la cookie y envía `x-csrf-token` en métodos mutantes.

## T3 · Manejo global de 401

- [x] `src/lib/api/sessionEvents.ts`: pub/sub `onSessionExpired`/`emitSessionExpired`.
- [x] `bffFetch` emite ante 401 (una vez, con cooldown y sin emitir para `/api/bff/auth/*`).
- [x] `Providers` suscribe: si no está en `/login`, `window.location.href = "/login"`.

## T4 · Observabilidad

- [x] `bffFetch`: correlation id (`crypto.randomUUID()`), header `x-correlation-id`, adjuntado al `ApiError` en errores.
- [x] `src/app/error.tsx` (client): mensaje + ID de error + "Recargar".
- [x] `src/app/global-error.tsx`: versión raíz con el mismo patrón.

## T5 · Performance

- [x] `next/dynamic` para `LlmAssistantPanel` en `TicketDetailView`.
- [x] Comparar salida de `next build` (chunks de `/app/tickets/[ticketId]`).

## T6 · Accesibilidad

- [x] Skip-link "Saltar al contenido" en `AppShell` + `id="main-content"` con `tabIndex={-1}` en `<main>`.
- [x] Revisar botones icon-only sin `aria-label` en flujos clave y corregir los que falten.
- [x] Nota WCAG AA en docs.

## T7 · Docs y cierre

- [x] Actualizar `ia-docs/init/changes.md` (entrada 011), `ia-docs/init/arquitecture.md` (sección Seguridad/Observabilidad, headers, CSRF, error boundaries), `roadmap.md` → 011 "En progreso".
- [x] Pendientes documentados: E2E tests, load testing, virtualización, densidad configurable.
- [x] Verificación: `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde; `curl -I` con headers; 401 → redirect.
