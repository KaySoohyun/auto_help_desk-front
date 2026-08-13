# Feature 011 · Hardening — Plan

## Contexto
- Fase 5 del plan: performance, security hardening, accesibilidad, observabilidad.
- Sin features nuevas ni dependencias. Todo es verificable con `build/lint/typecheck` y pruebas puntuales (headers, CSRF, 401, bundle).
- Puntos únicos de control ya existentes: `authenticatedFetch` (BFF→FastAPI), `bffFetch` (cliente→BFF), `AppShell`, `next.config.ts`.

## Estrategia
Aplicar hardening en capas que no cambian contratos ni UX existente; cada tarea es verificable de forma aislada.

1. **T1 · Headers de seguridad** — `next.config.ts` `headers()`: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` (siempre) y CSP (solo producción).
2. **T2 · CSRF hardening** — `src/lib/auth/csrf.ts` (token + set + verify); `setAuthCookies` setea la cookie; `authenticatedFetch` verifica header en métodos mutantes y setea cookie en GET; `bffFetch` envía el header en mutaciones.
3. **T3 · Manejo global de 401** — `src/lib/api/sessionEvents.ts` (pub/sub); `bffFetch` emite en 401; `Providers` suscribe y redirige a `/login`.
4. **T4 · Observabilidad** — correlation id en `bffFetch` (header + `ApiError`); `src/app/error.tsx` y `src/app/global-error.tsx` con mensaje + ID + "Recargar".
5. **T5 · Performance** — `next/dynamic` para `LlmAssistantPanel` en `TicketDetailView`; comparar `next build` (chunks de la ruta de tickets).
6. **T6 · Accesibilidad** — skip-link + `id="main-content"` en `AppShell`; revisión de botones icon-only sin `aria-label`; nota WCAG AA.
7. **T7 · Docs y cierre** — `changes.md`, `arquitecture.md`, `roadmap.md` → 011 "En progreso", tasks, verificación final.

## Verificación
- `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde (0 warnings).
- `curl -I` en build de producción: headers presentes.
- Dev con backend: mutación sin CSRF → 403; con header → OK; 401 → redirect a `/login`.
- `next build`: chunk de tickets reducido tras T5.
