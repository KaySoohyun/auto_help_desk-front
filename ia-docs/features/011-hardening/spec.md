# Feature 011 · Hardening

## Objetivo
Endurecer el frontend en performance, seguridad, accesibilidad y observabilidad, sin features funcionales nuevas ni dependencias nuevas. Base: `roadmap.md` → _011 · Hardening — performance, seguridad, accesibilidad y observabilidad (Fase 5)_.

## Contexto actual (auditoría rápida del código)
- **Sin headers de seguridad**: `next.config.ts` está vacío (sin CSP ni headers). No hay `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` ni `Permissions-Policy`.
- **Sin CSRF**: las cookies de acceso son `HttpOnly, SameSite=Lax, Secure` (mitigación base), pero no hay token CSRF. Todos los BFF mutantes pasan por `authenticatedFetch` (`src/lib/api/authenticated.ts`) — punto único de control.
- **401 en queries**: `bffFetch` lanza `ApiError` pero nadie fuerza logout/redirect global ante sesión expirada (el refresh ya existe en `authenticatedFetch` y en `session.store`).
- **Sin error boundaries**: no existen `error.tsx`, `global-error.tsx` ni `not-found.tsx`; no hay correlation id para soporte.
- **Bundle**: `LlmAssistantPanel` (769 líneas) se importa estáticamente en `TicketDetailView` (ruta de tickets → afecta el JS inicial de esa ruta).
- **A11y**: Topbar/inputs/dialogs ya tienen aria-labels y focus (radix maneja el focus trap). No hay skip-link; no hay `error.tsx`/`not-found` con recuperación clara.
- No hay `react-markdown` (la salida LLM se renderiza como texto plano → sin superficie XSS de markdown).

## Alcance

### Dentro
1. **Headers de seguridad (Etapa 5.2)** — `next.config.ts`: `headers()` con `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/geolocation denegadas) y CSP aplicado solo en producción (evita romper HMR en dev) con política compatible con App Router.
2. **CSRF hardening (Etapa 5.2)** — cookie `csrf_token` (no HttpOnly, SameSite=Lax, Secure en prod, path=/) generada con `crypto.randomUUID()`:
   - Se setea al iniciar sesión/refrescar (`setAuthCookies`) y, si falta, al recibir un GET autenticado.
   - `authenticatedFetch` verifica, para métodos != GET, que el header `x-csrf-token` coincida con la cookie; si no → 403. Respuestas GET sin cookie la setean.
   - `bffFetch` (cliente) lee la cookie y envía el header en mutaciones.
   - Cubre todos los BFF mutantes (users, tickets, knowledge, llm feedback, ai-policy) porque pasan por `authenticatedFetch`; logout incluido.
3. **Manejo global de 401 (Etapa 5.2)** — `bffFetch` emite un evento "sesión expirada" ante 401; `Providers` lo suscribe y hace `window.location.href = "/login"` (fuerza recarga y limpia estado en memoria), con guard para no redirigir si ya estás en `/login`.
4. **Observabilidad y quality (Etapa 5.4)** — correlation id:
   - `bffFetch` genera `crypto.randomUUID()` por request, lo envía como header `x-correlation-id` y, ante error, lo adjunta al `ApiError` (leyendo el echo del backend si existe).
   - Nuevos `src/app/error.tsx` y `src/app/global-error.tsx` (client) que muestran mensaje + ID de error + "Recargar". Sonner y errores de vista existentes se conservan.
5. **Performance (Etapa 5.1)** — `next/dynamic` para `LlmAssistantPanel` (y sus subcomponentes pesados) en `TicketDetailView`, reduciendo el JS inicial de la ruta de tickets. Verificación con la salida de `next build` (comparar bundle antes/después).
6. **Accesibilidad (Etapa 5.3)** — skip-link "Saltar al contenido" en `AppShell` con `href="#main-content"`, `id="main-content"` + `tabIndex={-1}` en el `<main>`; revisión de botones icon-only sin `aria-label`; nota WCAG AA en docs.
7. **Docs y cierre** — `changes.md`, `arquitecture.md` (sección Seguridad/Observabilidad), `roadmap.md` → 011 "En progreso", tasks, verificación final.

### Fuera de alcance (documentado como pendiente)
- E2E tests y load testing (requieren infraestructura/dependencias nuevas; se documenta como pendiente).
- Virtualización de tablas (no hay tablas de volumen alto real).
- Optimización de queries backend (responsabilidad de FastAPI).
- Densidad configurable de UI (preferencia de etapa 5.3 sin diseño previo aprobado).
- Nuevas features funcionales.

## Verificación
- `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde (0 warnings).
- Headers presentes: `curl -I` sobre una ruta servida (en build de producción) muestra `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` y CSP.
- CSRF: mutación sin header `x-csrf-token` → 403; con header correcto → OK. Verificar en dev con el backend.
- 401: forzar sesión expirada → redirige a `/login`.
- `next build` muestra reducción del chunk de la ruta de tickets tras el lazy-load.
