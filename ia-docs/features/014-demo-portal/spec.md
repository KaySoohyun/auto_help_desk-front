# Spec · Portal demo multi-tenant con acceso rápido

## Qué hace

Reacomoda el frontend para que la empresa (tenant) sea la primera unidad de la URL, con una landing que permite elegir empresa y accesos rápidos de prueba (usuarios demo con botones de un clic). Todo pensado para presentar el producto fácilmente: alguien entra, elige una empresa y entra a los portales sin registrarse.

## Contexto actual

- La landing `/` ofrece dos tarjetas estáticas: Personas y Empresas.
- Los portales viven en `/personas/login` y `/empresas/login` (login + registro con tabs).
- La app de agentes vive en `/app/*`; el portal de personas en `/panel/*`.
- El backend ya es multi-tenant: `GET /v1/tenants/public` devuelve `{id, name, slug}`; el login/registro aceptan `tenant_id`; el JWT lleva el tenant activo.
- No hay usuarios cliente con cuenta (la tabla `customers` no tiene `user_id`), así que hoy nadie puede "probar" el portal de personas sin registrarse.

## Objetivo

1. **URL con slug de empresa:** `/[slug]/personas/login`, `/[slug]/empresas/login`, `/[slug]/app/*`, `/[slug]/panel/*`. El slug identifica la empresa y resuelve al `tenant_id` que usa el backend.
2. **Landing con empresas reales:** `/` lista las empresas del backend (`GET /v1/tenants/public` vía BFF). Al elegir una, la URL toma el slug y se navega al login del portal elegido (personas o empresas).
3. **Acceso rápido de prueba:** en cada login por empresa, botones de un clic que inician sesión con usuarios demo (semillados en el backend), sin registrarse ni tipear credenciales.
   - Portal personas: botón **Cliente demo** (uno por empresa).
   - Portal empresas: botones **Agente demo**, **Supervisor demo**, **Admin de tenant demo** y **Admin de plataforma demo**.
4. **Cierre de sesión a la landing:** al salir, se vuelve a `/` para elegir otra empresa (o repetir la demo).
5. **Compatibilidad:** las rutas viejas (`/app`, `/panel`, `/login`, `/personas/login`, `/empresas/login`) redirigen a `/`.

## Decisiones tomadas (con el usuario)

- Se mantienen **dos portales por empresa** (personas y empresas), no se unifica.
- Los **botones demo incluyen todos los roles** (cliente, agente, supervisor, tenant_admin, platform_admin).
- El **registro se conserva tal cual hoy**, con selección múltiple de tenants.
- La **lista de empresas de la landing sale solo del backend** (sin catálogo hardcodeado de empresas).

## Criterios de aceptación

1. `/` muestra las empresas devueltas por el backend (estado de error con botón de reintentar si falla).
2. Cada empresa ofrece enlace a sus dos portales; el enlace lleva el slug en la URL.
3. En `/[slug]/personas/login` y `/[slug]/empresas/login`, el formulario de login/registro funciona y el tenant usado es el del slug (sin que el usuario lo seleccione).
4. Los botones de acceso rápido inician sesión al instante con el rol correcto y redirigen a `/[slug]/app` (roles de soporte) o `/[slug]/panel` (cliente).
5. El botón "Cliente demo" de cada empresa loguea con el cliente demo de esa empresa.
6. Sin sesión: `/[slug]/app` → `/[slug]/empresas/login`; `/[slug]/panel` → `/[slug]/personas/login`. Con sesión de rol incorrecto, se redirige al portal del rol (customer → panel, resto → app).
7. Con sesión, entrar a un login → redirige a la home del rol manteniendo el slug.
8. `/[slug]/app` exacto → `/[slug]/app/tickets`.
9. Logout → `/` (landing).
10. Las rutas legacy (`/app`, `/panel`, `/login`, `/personas/login`, `/empresas/login`) redirigen a `/`.
11. Sidebar, Topbar, PersonaHeader y PersonaShell navegan usando el slug actual.
12. Al cambiar de tenant desde el menú de usuario, se navega al app/panel del tenant elegido.
13. Si el slug no corresponde a ninguna empresa del backend → `notFound()`.
14. `pnpm lint`, `pnpm typecheck` y `pnpm build` en verde; sin warnings.
