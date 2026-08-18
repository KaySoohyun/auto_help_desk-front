# Tasks · Portal demo multi-tenant con acceso rápido

Estado: ☐ pendiente · ☐ en curso · ☑ hecho

## 1. Base de rutas con slug

- [x] ☐ Crear `src/lib/tenant/server.ts` con `getPublicTenants()` y `getTenantBySlug(slug)`.
- [x] ☐ Mover `src/app/(public)/personas/login/` → `src/app/[slug]/personas/login/` y resolver el slug (server): validar tenant con `getTenantBySlug` (si no existe → `notFound()`) y pasar `tenant` a `LoginForm`/`RegisterForm`.
- [x] ☐ Mover `src/app/(public)/empresas/login/` → `src/app/[slug]/empresas/login/` (misma lógica de resolución).
- [x] ☐ Mover `src/app/app/*` → `src/app/[slug]/app/*`; el layout pasa `slug`/`tenantName` a `AppShell`.
- [x] ☐ Mover `src/app/(personas)/panel/*` → `src/app/[slug]/panel/*`; el layout pasa `slug` a `PersonaShell`.
- [x] ☐ Eliminar `src/app/login/` y `src/app/(public)/personas/` / `(public)/empresas/` vacías.

## 2. Navegación con slug

- [x] ☐ `src/lib/auth/routing.ts`: `homePathForRole(role, slug)`.
- [x] ☐ `LoginForm`: prop `tenant`; mandar `tenant_id`; navegar con slug.
- [x] ☐ `RegisterForm`: prop `tenant`; pre-seleccionar el tenant del slug; navegar con slug.
- [x] ☐ `AppShell` recibe `slug`; redirige customers a `/${slug}/panel`.
- [x] ☐ `Sidebar`: items `/${slug}/app/...`; active por pathname.
- [x] ☐ `Topbar`: logout → `/`; switch-tenant navega a `/${tenant.slug}/app` o `/panel`.
- [x] ☐ `PersonaShell` recibe `slug`; redirige no-customer a `/${slug}/app`.
- [x] ☐ `PersonaHeader`: links con slug.

## 3. Landing con empresas

- [x] ☐ Reescribir `src/app/(public)/page.tsx` como Server Component: cards por empresa (nombre + slug + acceso personas/empresas) desde `getPublicTenants()`; estado de error con reintentar.

## 4. Acceso rápido demo

- [x] ☐ Crear `src/lib/auth/demo-users.ts` (catálogo de demo users por rol + cliente por slug).
- [x] ☐ Crear `src/components/features/auth/DemoLoginButtons.tsx` (modo `customer` y modo `support`).
- [x] ☐ Integrar `DemoLoginButtons` en `/[slug]/personas/login` (cliente) y `/[slug]/empresas/login` (soporte).

## 5. proxy.ts

- [x] ☐ Actualizar `matcher` y lógica: slug en las rutas; legacy → `/`; redirecciones por rol manteniendo slug; `/[slug]/app` → `/[slug]/app/tickets`.

## 6. Limpieza y verificación

- [x] ☐ Grep de links hardcodeados `/app`, `/panel`, `/personas`, `/empresas` sin resolver y actualizarlos.
- [x] ☐ `pnpm lint`, `pnpm typecheck`, `pnpm build` en verde.
- [ ] ☐ Probar el flujo completo contra backend local (seed de demo users aplicado).
- [ ] ☐ Actualizar `ia-docs/init/changes.md` y mover la feature a "Hecho" en `constitution/roadmap.md`.
