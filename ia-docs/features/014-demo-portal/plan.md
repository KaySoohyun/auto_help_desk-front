# Plan · Portal demo multi-tenant con acceso rápido

## Enfoque

La empresa pasa a ser el primer segmento de la URL (`/[slug]`). El slug se resuelve a un `tenant` (id + name) usando el endpoint público del backend, de modo que los formularios de login/registro y los botones demo mandan `tenant_id` correcto sin que el usuario lo elija. Las rutas de aplicación (`/app`, `/panel`) y los portales de login se mueven bajo el segmento dinámico.

No se toca el BFF de login/registro: ya aceptan `tenant_id`.

## Estructura de rutas resultante

```
/                             → landing con selector de empresas
/[slug]/personas/login        → portal personas (cliente): login + registro + botón Cliente demo
/[slug]/empresas/login        → portal empresas (agente): login + registro + botones demo
/[slug]/app/*                 → consola de agentes (AppShell)
/[slug]/panel/*               → portal de personas (PersonaShell)
```

## Resolución de slug → tenant

- Helper server `src/lib/tenant/server.ts`:
  - `getPublicTenants()` → `fastApiFetch<Tenant[]>("/v1/tenants/public")` (solo se usa en Server Components / Route Handlers).
  - `getTenantBySlug(slug)` → tenant o `null`.
- Las páginas de login (Server Component) resuelven el slug, validan que exista (`notFound()` si no) y pasan `tenantId`/`tenantName` a los formularios (client).
- Los layouts de `/[slug]/app` y `/[slug]/panel` resuelven el tenant y lo inyectan en el shell (prop `slug` + nombre) para Topbar/Sidebar/PersonaHeader.

## Catálogo de usuarios demo (frontend)

Hardcodeado en `src/lib/auth/demo-users.ts` (los usuarios reales los crea el seed del backend):

```ts
interface DemoUser { role: UserRole; email: string; password: string; }
// roles de soporte (un usuario compartido con membresía en todos los tenants demo)
DEMO_SUPPORT_USERS: DemoUser[]
// cliente por slug (el seed crea demo.cliente.<slug>@example.com)
DEMO_CUSTOMER_BY_SLUG: Record<string, DemoUser>
```

- Soporte: `demo.agente@example.com` (agent), `demo.supervisor@example.com` (supervisor), `demo.admin@example.com` (tenant_admin), `demo.plataforma@example.com` (platform_admin). Password común `demo-pass-123`.
- Cliente: `demo.cliente.<slug>@example.com` / `demo-pass-123`, por slug.
- `platform_admin` entra **sin** `tenant_id`; el resto entra con el `tenant_id` del slug.

## Componentes

### `DemoLoginButtons` (client) — `src/components/features/auth/DemoLoginButtons.tsx`

- Props: `{ role: "customer" | "support"; tenant: { id, name } }`.
- Para `customer`: un botón "Entrar como cliente demo" (solo si hay demo user para ese slug).
- Para `support`: cuatro botones (agente, supervisor, admin de tenant, admin de plataforma) con ícono y label.
- Cada botón llama `login({ email, password, tenant_id })` del `session.store` (sin `tenant_id` para plataforma) y luego `router.replace(homePathForRole(role, slug))`.
- Estado de carga por botón y manejo de error inline.
- Siempre bajo una nota: "Cuentas de demostración · sin registro".

### Refactor de `LoginForm` / `RegisterForm`

- Nueva prop opcional `tenant?: { id: string; name: string }`.
- Si viene `tenant.id`, el login lo manda como `tenant_id`; el registro lo pre-selecciona (sin perder el selector múltiple actual).
- Al navegar tras login/registro usan `homePathForRole(role, slug)`.

### `homePathForRole` — `src/lib/auth/routing.ts`

- Firma nueva: `homePathForRole(role: UserRole, slug: string): string` → `/${slug}/panel` (customer) o `/${slug}/app`.

### Landing — `src/app/(public)/page.tsx`

- Server Component que resuelve las empresas con `getPublicTenants()`.
- Cards por empresa: nombre + slug + dos accesos ("Portal de personas" y "Portal de empresas") → `/[slug]/personas/login` y `/[slug]/empresas/login`.
- Estado vacío/error con reintentar (client, reutiliza `usePublicTenants` como fallback si hace falta o muestra mensaje).

### Shells

- `AppShell`: recibe `slug` (y `tenantName` opcional) como prop desde el layout; se lo pasa a `Sidebar` y `Topbar`; redirige customers a `/${slug}/panel`.
- `Sidebar`: los items pasan a `/${slug}/app/...`; `active` se calcula sobre el pathname real.
- `Topbar`: logout → `/`; al cambiar de tenant navega a `/${tenant.slug}/app` (o `/panel` si es customer).
- `PersonaShell`: recibe `slug`; redirige roles no-customer a `/${slug}/app`; pasa slug a `PersonaHeader`.
- `PersonaHeader`: links con slug.

## proxy.ts

- `matcher`: `["/", "/:slug/personas/login", "/:slug/empresas/login", "/:slug/app/:path*", "/:slug/panel/:path*", "/app", "/panel", "/login", "/personas/login", "/empresas/login"]`.
- Parseo de slug: `pathname.split("/")[1]`.
- Rutas legacy → redirect a `/`.
- Lógica por rol (misma que hoy, con slug en las redirecciones de destino).

## Migración de rutas (movidas, no reescritas)

- `src/app/(public)/personas/login/` → `src/app/[slug]/personas/login/`
- `src/app/(public)/empresas/login/` → `src/app/[slug]/empresas/login/`
- `src/app/app/*` → `src/app/[slug]/app/*` (incluye `layout.tsx` → pasa `slug` a `AppShell`)
- `src/app/(personas)/panel/*` → `src/app/[slug]/panel/*` (incluye `layout.tsx` → pasa `slug` a `PersonaShell`)
- `src/app/login/` → se elimina (lo cubre el redirect del proxy)

## Riesgos / decisiones

- La app y el panel dependen del slug para navegación interna: hay que actualizar todos los links hardcodeados (`/app`, `/panel`, `/personas`, `/empresas`) para no romper la demo.
- El tenant del JWT es la autoridad real del backend; el slug es contexto de presentación. Por eso, tras login, siempre se navega al slug de la empresa elegida (consistente con el JWT emitido).
- No se añaden dependencias.
