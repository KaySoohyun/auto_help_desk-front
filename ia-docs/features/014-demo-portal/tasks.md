# Tasks · Portal demo multi-tenant con acceso rápido

Estado: ☐ pendiente · ☐ en curso · ☑ hecho

## 1. Base de rutas con slug

- [ ] ☐ Crear `src/lib/tenant/server.ts` con `getPublicTenants()` y `getTenantBySlug(slug)`.
- [ ] ☐ Mover `src/app/(public)/personas/login/` → `src/app/[slug]/personas/login/` y resolver el slug (server): validar tenant con `getTenantBySlug` (si no existe → `notFound()`) y pasar `tenant` a `LoginForm`/`RegisterForm`.
- [ ] ☐ Mover `src/app/(public)/empresas/login/` → `src/app/[slug]/empresas/login/` (misma lógica de resolución).
- [ ] ☐ Mover `src/app/app/*` → `src/app/[slug]/app/*`; el layout pasa `slug`/`tenantName` a `AppShell`.
- [ ] ☐ Mover `src/app/(personas)/panel/*` → `src/app/[slug]/panel/*`; el layout pasa `slug` a `PersonaShell`.
- [ ] ☐ Eliminar `src/app/login/` y `src/app/(public)/personas/` / `(public)/empresas/` vacías.

## 2. Navegación con slug

- [ ] ☐ `src/lib/auth/routing.ts`: `homePathForRole(role, slug)`.
- [ ] ☐ `LoginForm`: prop `tenant`; mandar `tenant_id`; navegar con slug.
- [ ] ☐ `RegisterForm`: prop `tenant`; pre-seleccionar el tenant del slug; navegar con slug.
- [ ] ☐ `AppShell` recibe `slug`; redirige customers a `/${slug}/panel`.
- [ ] ☐ `Sidebar`: items `/${slug}/app/...`; active por pathname.
- [ ] ☐ `Topbar`: logout → `/`; switch-tenant navega a `/${tenant.slug}/app` o `/panel`.
- [ ] ☐ `PersonaShell` recibe `slug`; redirige no-customer a `/${slug}/app`.
- [ ] ☐ `PersonaHeader`: links con slug.

## 3. Landing con empresas

- [ ] ☐ Reescribir `src/app/(public)/page.tsx` como Server Component: cards por empresa (nombre + slug + acceso personas/empresas) desde `getPublicTenants()`; estado de error con reintentar.

## 4. Acceso rápido demo

- [ ] ☐ Crear `src/lib/auth/demo-users.ts` (catálogo de demo users por rol + cliente por slug).
- [ ] ☐ Crear `src/components/features/auth/DemoLoginButtons.tsx` (modo `customer` y modo `support`).
- [ ] ☐ Integrar `DemoLoginButtons` en `/[slug]/personas/login` (cliente) y `/[slug]/empresas/login` (soporte).

## 5. proxy.ts

- [ ] ☐ Actualizar `matcher` y lógica: slug en las rutas; legacy → `/`; redirecciones por rol manteniendo slug; `/[slug]/app` → `/[slug]/app/tickets`.

## 6. Limpieza y verificación

- [ ] ☐ Grep de links hardcodeados `/app`, `/panel`, `/personas`, `/empresas` sin resolver y actualizarlos.
- [ ] ☐ `pnpm lint`, `pnpm typecheck`, `pnpm build` en verde.
- [ ] ☐ Probar el flujo completo contra backend local (seed de demo users aplicado).
- [ ] ☐ Actualizar `ia-docs/init/changes.md` y mover la feature a "Hecho" en `constitution/roadmap.md`.
