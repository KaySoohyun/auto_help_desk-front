# Plan de trabajo y diseño integral  
## Sistema de gestión de tickets de soporte con base de conocimiento y asistencia LLM

A continuación te dejo el diseño completo de la aplicación frontend en Next.js, pensado para un sistema SaaS multi-tenant de soporte, con agentes, supervisores, administradores, auditores, base de conocimiento, asistencia LLM responsable y fuerte énfasis en seguridad, PII, auditoría y prevención de fuga de información.

---

## 0. Supuestos clave

Antes de diseñar, dejo explícitos los supuestos principales:

1. **Backend FastAPI como fuente de verdad**
   - La API backend maneja autenticación, autorización, tenant efectivo, reglas de negocio, auditoría y orquestación del LLM.
   - El frontend no llama directamente al proveedor LLM; siempre pasa por backend.

2. **Multi-tenant real**
   - Un usuario puede pertenecer a uno o varios tenants.
   - El backend valida membresía y permisos por tenant en cada operación.
   - El frontend refleja el tenant activo en la URL y en el estado de sesión.

3. **LLM como asistente, no como agente autónomo**
   - Toda sugerencia debe ser revisada, editada o descartada por una persona.
   - No se ejecutan acciones automáticas basadas en la salida del LLM.

4. **Datos sensibles**
   - Los tickets pueden contener PII.
   - El frontend debe enmascarar por defecto y permitir revelado solo con permiso explícito y auditoría.

5. **Experiencia desktop-first**
   - El trabajo principal es operativo y en escritorio.
   - Tablet debe ser usable, pero no es el objetivo primario.

6. **Real-time no es requisito inicial**
   - Se puede comenzar con consultas periódicas o invalidaciones.
   - WebSocket/SSE queda como mejora posterior si se necesita actualización en vivo.

7. **Stack elegido**
   - Next.js App Router
   - TypeScript
   - Tailwind CSS
   - shadcn/ui
   - TanStack Query
   - React Hook Form
   - Zod
   - Zustand para estado global liviano
   - Route Handlers como BFF
   - Middleware para protección de rutas y tenant
   - ESLint + Prettier

---

# 1. Resumen ejecutivo

## Concepto de diseño

Propongo una **consola operativa de soporte enterprise**, orientada a productividad, claridad y seguridad. La aplicación debe sentirse como una herramienta de trabajo intensivo: rápida, densa pero legible, con estados visibles, acciones confirmables y asistencia LLM siempre en modo de borrador.

La idea central es:

> **El agente trabaja tickets con asistencia inteligente, pero el control humano nunca se delega.**

## Decisiones principales

### Arquitectura
- **Next.js App Router** con rutas agrupadas por dominio.
- **BFF en Route Handlers** para hablar con FastAPI.
- **Cookies HttpOnly** para tokens, evitando exponer refresh/access tokens a JavaScript.
- **URLs scoping por tenant**, por ejemplo:  
  `/tenant/[tenantSlug]/tickets/[ticketId]`
- **Server Components** para guards, layouts y datos no interactivos.
- **Client Components** para tablas, filtros, composer, panel LLM y formularios dinámicos.
- **TanStack Query** para server state interactivo.
- **Zustand** para estado UI liviano: sesión, tenant, preferencias, selección de tickets.

### Seguridad
- Autenticación con flujo BFF.
- Autorización validada en UI y backend.
- PII enmascarada por defecto.
- Revelado de PII con confirmación, motivo opcional y auditoría.
- Prevención de prompt injection: contenido del cliente tratado como no confiable.
- Sin ejecución automática de sugerencias LLM.

### UX LLM
- Panel lateral persistente dentro del ticket.
- Sugerencias editables.
- Indicador de confianza.
- Fuentes citadas.
- Riesgos detectados.
- Feedback útil/no útil.
- Auditoría de aceptación, edición o rechazo.

### Diseño visual
- Estilo SaaS enterprise sobrio.
- Modo claro y oscuro.
- Colores semánticos para prioridad, SLA, estado, riesgo y PII.
- Densidad media/alta.
- Componentes accesibles y estados bien definidos.

---

# 2. Arquitectura frontend

## 2.1 Principios arquitectónicos

1. **Frontend como capa de presentación y orquestación UX**
   - No maneja reglas críticas de negocio.
   - No decide permisos finales.
   - No confía ciegamente en el estado cliente.

2. **Backend como autoridad**
   - FastAPI valida tenant, permisos, PII, límites LLM y auditoría.
   - El frontend solo muestra lo que el backend autoriza.

3. **BFF para seguridad**
   - Next.js Route Handlers actúan como Backend For Frontend.
   - El navegador no habla directamente con FastAPI si se quiere máxima seguridad.
   - El BFF maneja cookies, tokens, CSRF, tenant y errores de autenticación.

4. **Separación clara entre server y client**
   - Server Components para guards, layouts, metadata y vistas poco interactivas.
   - Client Components para interacciones operativas intensivas.

5. **Estado servidor en TanStack Query**
   - Lists, detail, mutations, invalidations.
   - URL como fuente de verdad para filtros y paginación.

6. **Estado UI liviano en Zustand**
   - Sesión, tenant activo, preferencias visuales, selección de filas, panel LLM abierto/cerrado.

---

## 2.2 Alternativas de arquitectura y recomendación

### Alternativa A — BFF con cookies HttpOnly (recomendada)

**Descripción**  
Next.js Route Handlers reciben requests del navegador, guardan tokens en cookies HttpOnly y llaman a FastAPI con Authorization header.

**Ventajas**
- Refresh token no visible para JavaScript.
- Menor riesgo de XSS robando tokens.
- Permite controlar CSRF, tenant y refresh desde el servidor.
- Mejor postura para entornos con PII.

**Desventajas**
- Más complejidad inicial.
- Hay que manejar refresh/retry en el BFF.
- Streaming LLM debe proxyearse correctamente.

**Cuándo usarla**  
Recomendada para este sistema por sensibilidad de datos, multi-tenant y auditoría.

---

### Alternativa B — SPA directa a FastAPI con access token en memoria

**Descripción**  
El navegador llama directo a FastAPI. Access token en memoria, refresh token en cookie HttpOnly o flujo silencioso.

**Ventajas**
- Arquitectura más simple.
- Menos proxy.

**Desventajas**
- Mayor superficie para XSS si algo de token cae en JS.
- Manejo más delicado de CSRF y renovación.
- Menos control server-side de tenant en cada request.

**Cuándo usarla**  
Si el backend ya tiene un gateway muy robusto y el riesgo de XSS se controla fuertemente.

---

### Alternativa C — OAuth/OIDC con PKCE directo desde browser

**Descripción**  
Login delegado en IdP, tokens en memoria, interacción directa con API.

**Ventajas**
- Muy bueno si ya hay IdP corporativo.
- Menos lógica custom de login.

**Desventajas**
- Complejidad de sesiones multi-tenant.
- Puede requerir BFF de todas formas para PII y auditoría fina.

**Cuándo usarla**  
Si la organización ya usa OIDC y se acepta un BFF igualmente para operaciones sensibles.

### Recomendación final
**Alternativa A: BFF con cookies HttpOnly.**

---

## 2.3 Estructura de carpetas propuesta

```text
src/
  app/
    (public)/
      login/
      forgot-password/
      reset-password/
      error/
    (auth)/
      tenant/
        select/
    tenant/
      [tenantSlug]/
        dashboard/
        tickets/
          [ticketId]/
        knowledge/
          articles/
            [articleId]/
          categories/
        admin/
          users/
          teams/
          roles/
          sla/
          channels/
          categories/
          tags/
          templates/
          retention/
          llm/
          privacy/
        audit/
        settings/
          profile/
          preferences/
          security/
    api/
      bff/
        auth/
        tenants/
        tickets/
        knowledge/
        audit/
        admin/
    error.tsx
    global-error.tsx
    not-found.tsx

  components/
    ui/
    layout/
    features/
      auth/
      tickets/
      llm/
      knowledge/
      admin/
      audit/
      shared/

  hooks/
    auth/
    tickets/
    knowledge/
    audit/
    llm/

  lib/
    api/
    auth/
    tenant/
    permissions/
    pii/
    audit/
    llm/
    validation/
    utils/
    constants/

  stores/
    session.store.ts
    tenant.store.ts
    ui.store.ts
    ticket-selection.store.ts

  types/
    auth.types.ts
    ticket.types.ts
    knowledge.types.ts
    audit.types.ts
    llm.types.ts

  styles/
    globals.css
    themes.css

proxy.ts        # ex middleware.ts (Next 16)
```

---

## 2.4 Server Components vs Client Components

### Server Components
Recomendados para:
- Layouts autenticados.
- Guards iniciales de sesión y tenant.
- Metadata de página.
- Vistas de solo lectura con poca interacción.
- Carga inicial de permisos y configuración de tenant.
- Páginas de error y acceso denegado.

### Client Components
Recomendados para:
- Bandeja de tickets.
- Filtros y búsqueda.
- Selección múltiple.
- Detalle interactivo de ticket.
- Conversation thread.
- Reply composer.
- Internal note composer.
- Panel LLM.
- Formularios con validación dinámica.
- Knowledge article editor.
- Tablas de auditoría con filtros activos.

### Regla práctica
- Si es **lectura estática o control de acceso**, RSC.
- Si hay **interacción frecuente, optimistic UI, streaming o formularios**, Client Component.

---

## 2.5 Route Handlers vs Server Actions

### Recomendación principal
Usar **Route Handlers como BFF** para casi todo.

### Razones
- Mejor control de proxies hacia FastAPI.
- Más simple para manejar streaming LLM.
- Mejor manejo de CSRF, headers, tenant y refresh.
- Permite una capa uniforme de errores y logging.

### Dónde sí usar Server Actions
Opcionalmente en:
- Formularios simples de settings.
- Mutaciones administrativas no sensibles.
- Acciones donde no se necesita streaming ni proxy complejo.

### Decisión sugerida
Para mantener consistencia y seguridad:  
**Route Handlers para todas las operaciones sensibles y mutations principales.**

---

## 2.6 Proxy de Next.js (ex Middleware)

El proxy (archivo `proxy.ts`, renombrado desde `middleware.ts` en Next 16) debe ser liviano y no tomar decisiones finales de autorización.

### Responsabilidades
- Detectar si existe sesión activa.
- Redirigir a `/login` si no hay sesión.
- Redirigir a `/tenant/select` si falta tenant activo.
- Proteger rutas públicas si el usuario ya está autenticado.
- Validar estructura básica de `/tenant/[tenantSlug]`.

### No debe hacer
- Validar permisos finos.
- Confiar en claims sin verificación backend.
- Reemplazar la autorización del backend.

---

## 2.7 Manejo de sesión

### Flujo recomendado
1. Usuario envía credenciales a `/api/bff/auth/login`.
2. BFF llama a FastAPI.
3. FastAPI devuelve tokens y datos de usuario.
4. BFF guarda:
   - access token en cookie HttpOnly de vida corta.
   - refresh token en cookie HttpOnly más restrictiva.
5. Cliente recibe solo datos públicos de sesión.

### Cookies sugeridas
- `access_token`
  - HttpOnly
  - Secure
  - SameSite=Lax
  - Path=/
  - Vida corta
- `refresh_token`
  - HttpOnly
  - Secure
  - SameSite=Strict
  - Path=/ (nota: necesario para que `/api/bff/me` pueda hacer refresh automático; mitigado por SameSite=Strict)
- `csrf_token`
  - Puede ser legible por JS si se usa doble submit.
  - Nunca debe ser sensible como un token de sesión.

### Renovación
- Si una request a FastAPI devuelve 401:
  - BFF intenta refresh una vez.
  - Si funciona, reintenta la request original.
  - Si falla, limpia sesión y devuelve estado de sesión expirada.

### Cierre de sesión
- Llama a backend para revocar/invalidar refresh.
- Borra cookies en BFF.
- Limpia estado local y query cache sensible.

---

## 2.8 Manejo de tenant activo

### Estrategia recomendada
- URL como fuente visible: `/tenant/[tenantSlug]/...`
- Backend como fuente de verdad de membresía.
- BFF resuelve tenantSlug a tenantId válido antes de llamar endpoints.

### Flujo
1. Login exitoso.
2. Backend devuelve tenants permitidos.
3. Si hay un solo tenant, redirigir directamente.
4. Si hay varios, ir a `/tenant/select`.
5. Al seleccionar tenant, redirigir a `/tenant/[tenantSlug]/dashboard`.

### Controles
- TenantSwitcher solo muestra tenants autorizados.
- Si el usuario intenta entrar a un tenant no permitido:
  - mostrar estado 403.
  - auditar intento si corresponde.

### Platform admin
- Puede tener una sección global `/platform/...`.
- Si entra a un tenant específico, debe existir banner explícito de “modo plataforma” o “visualizando tenant X”.

---

## 2.9 Manejo de caché

### Recomendación general
Para datos sensibles:
- `no-store` en fetch server-side.
- No persistir query cache sensible en storage local.
- Cache en memoria únicamente.

### Dónde usar caché
- Configuración estática de UI.
- Listas de metadata poco cambiantes: prioridades, canales, categorías.
- Permisos durante el request actual.

### Dónde evitar caché agresiva
- Conversaciones de tickets.
- PII.
- Auditoría.
- Sugerencias LLM.

### TanStack Query
- `staleTime` bajo para tickets.
- `refetchOnWindowFocus` selectivo.
- Query keys siempre con tenant:
  - `['tenant', tenantSlug, 'tickets', filters]`
  - `['tenant', tenantSlug, 'ticket', ticketId]`

---

## 2.10 Manejo de errores

### Modelo recomendado
- Error tipado con:
  - status
  - code
  - message amigable
  - details de validación
  - correlationId para logs

### Respuesta de error estándar del BFF
```json
{
  "error": {
    "code": "FORBIDDEN_TENANT",
    "message": "No tienes acceso a este tenant.",
    "details": [],
    "correlationId": "abc123"
  }
}
```

### Clasificación UX
- **400 / 422**: validación de formularios.
- **401**: sesión expirada.
- **403**: acceso denegado.
- **404**: recurso inexistente o sin acceso.
- **429**: límite de uso o rate limit.
- **500**: error inesperado.

### Patrones
- Toast para errores transitorios.
- Inline error en formularios.
- Empty state con permiso insuficiente.
- Página completa para 403/404 graves.
- Modal de sesión expirada.

---

# 3. Sitemap y navegación

## 3.1 Sitemap público / auth

```text
/login
/login/mfa
/forgot-password
/reset-password
/tenant/select
/error/access-denied
/error/not-found
/error/server
```

## 3.2 Sitemap por tenant

```text
/tenant/[tenantSlug]/dashboard
/tenant/[tenantSlug]/tickets
/tenant/[tenantSlug]/tickets/[ticketId]
/tenant/[tenantSlug]/knowledge
/tenant/[tenantSlug]/knowledge/articles
/tenant/[tenantSlug]/knowledge/articles/[articleId]
/tenant/[tenantSlug]/knowledge/articles/new
/tenant/[tenantSlug]/knowledge/categories
/tenant/[tenantSlug]/audit
/tenant/[tenantSlug]/settings/profile
/tenant/[tenantSlug]/settings/preferences
/tenant/[tenantSlug]/settings/security
```

## 3.3 Sitemap administrativo por tenant

```text
/tenant/[tenantSlug]/admin
/tenant/[tenantSlug]/admin/users
/tenant/[tenantSlug]/admin/teams
/tenant/[tenantSlug]/admin/roles
/tenant/[tenantSlug]/admin/sla
/tenant/[tenantSlug]/admin/channels
/tenant/[tenantSlug]/admin/categories
/tenant/[tenantSlug]/admin/tags
/tenant/[tenantSlug]/admin/templates
/tenant/[tenantSlug]/admin/retention
/tenant/[tenantSlug]/admin/llm
/tenant/[tenantSlug]/admin/privacy
```

## 3.4 Sitemap de plataforma (opcional)

Si existe un admin de plataforma global:

```text
/platform/tenants
/platform/tenants/[tenantId]
/platform/users
/platform/audit
/platform/settings
```

## 3.5 Reglas de navegación

- Después de login, si hay un solo tenant:
  - redirect a `/tenant/[tenantSlug]/dashboard`.
- Si hay múltiples:
  - `/tenant/select`.
- Si un usuario autenticado entra a `/login`:
  - redirect a dashboard o tenant select.
- Si falta tenant activo:
  - redirect a selección de tenant.
- Si el usuario no tiene permiso para una sección:
  - ocultar nav item.
  - si entra por URL, mostrar acceso denegado.

---

# 4. Roles y permisos

## 4.1 Roles propuestos

1. **Agente de soporte**
2. **Supervisor**
3. **Administrador de tenant**
4. **Administrador de plataforma**
5. **Auditor**

---

## 4.2 Matriz de permisos propuesta

| Capacidad | Agente | Supervisor | Tenant Admin | Platform Admin | Auditor |
|---|---:|---:|---:|---:|---:|
| Ver dashboard | ✅ | ✅ | ✅ | ✅ | ✅ limitado |
| Ver tickets | ✅ | ✅ | ✅ | ✅ | ✅ read-only |
| Responder públicamente | ✅ | ✅ | ✅ | ✅ | ❌ |
| Notas internas | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Asignar/reasignar tickets | 🔶 | ✅ | ✅ | ✅ | ❌ |
| Acciones bulk | 🔶 | ✅ | ✅ | ✅ | ❌ |
| Usar asistente LLM | ✅ | ✅ | ✅ | ✅ | ❌ |
| Aceptar/editar sugerencia LLM | ✅ | ✅ | ✅ | ✅ | ❌ |
| Revelar PII | 🔶 | ✅ | ✅ | ✅ | 🔶 |
| Gestionar KB borradores | 🔶 | ✅ | ✅ | ✅ | ❌ |
| Publicar KB | ❌ | ✅ | ✅ | ✅ | ❌ ||
| Gestionar usuarios | ❌ | 🔶 | ✅ | ✅ | ❌ |
| Gestionar equipos | ❌ | 🔶 | ✅ | ✅ | ❌ |
| Gestionar roles | ❌ | ❌ | ✅ | ✅ | ❌ |
| Configurar SLA | ❌ | 🔶 | ✅ | ✅ | ❌ |
| Configurar canales/categorías/tags | ❌ | 🔶 | ✅ | ✅ | ❌ |
| Configurar plantillas | ❌ | ✅ | ✅ | ✅ | ❌ |
| Configurar retención/privacidad | ❌ | ❌ | ✅ | ✅ | ❌ |
| Configurar LLM/límites | ❌ | ❌ | ✅ | ✅ | ❌ |
| Ver auditoría | ❌ | 🔶 | ✅ | ✅ | ✅ |
| Exportar auditoría | ❌ | ❌ | 🔶 | ✅ | 🔶 |
| Administrar tenants | ❌ | ❌ | ❌ | ✅ | ❌ |

### Notas
- ✅ permitido por defecto.
- 🔶 configurable por política del tenant.
- ❌ no permitido.
- El backend siempre debe validar cada acción, independientemente de lo que muestre la UI.

---

## 4.3 Permisos recomendados por rol

### Agente
- Trabajar tickets asignados o visibles según política.
- Responder, notas internas, adjuntos.
- Usar LLM para clasificar, resumir y sugerir.
- Ver KB publicada.
- No administra usuarios ni configuración.

### Supervisor
- Todo lo del agente.
- Asignación, priorización, bulk actions.
- Monitoreo de SLA.
- Gestión básica de KB y plantillas.
- Visión de equipo y riesgo operativo.

### Tenant Admin
- Administra usuarios, equipos, roles dentro de su tenant.
- Configura SLA, canales, categorías, tags, plantillas.
- Configura LLM, privacidad y retención.
- Ve auditoría del tenant.
- No administra otros tenants.

### Platform Admin
- Administra tenants, planes, límites globales, usuarios plataforma.
- Puede ver auditoría global.
- Puede intervenir tenants con justificación y auditoría.

### Auditor
- Acceso read-only a tickets y eventos.
- Puede revisar auditoría de acciones humanas y LLM.
- No debe poder ejecutar acciones operativas.
- Revelado de PII solo si política lo permite.

---

# 5. Flujos principales de usuario

## 5.1 Login y selección de tenant

### Flujo feliz
1. Usuario entra a `/login`.
2. Ingresa credenciales.
3. Si se requiere MFA, se redirige a `/login/mfa`.
4. BFF valida y obtiene sesión.
5. Backend devuelve tenants permitidos.
6. Si hay un tenant:
   - redirect a `/tenant/[tenantSlug]/dashboard`.
7. Si hay varios:
   - redirect a `/tenant/select`.
8. Usuario selecciona tenant.
9. Se establece navegación dentro de `/tenant/[tenantSlug]/...`.

### Estados
- Credenciales inválidas.
- MFA pendiente.
- Usuario sin tenants asignados.
- Tenant suspendido.
- Red a backend caída.

---

## 5.2 Agente abre bandeja y trabaja un ticket

### Flujo
1. Entra a `/tenant/[slug]/tickets`.
2. Ve lista con filtros por estado, prioridad, canal, agente, SLA, tags.
3. Busca o filtra.
4. Selecciona un ticket.
5. Se abre `/tenant/[slug]/tickets/[ticketId]`.
6. Revisa conversación, metadata, SLA y PII.
7. Responde o agrega nota interna.
8. Cambia estado, prioridad o asignación si tiene permiso.

### Estados
- Lista vacía por filtros.
- Error de red.
- Permiso insuficiente.
- Ticket cerrado o bloqueado.
- PII enmascarada.

---

## 5.3 Agente usa asistencia LLM

### Flujo
1. Dentro del ticket, abre panel LLM.
2. Elige acción:
   - clasificar
   - resumir
   - sugerir respuesta
   - buscar artículos
3. El sistema muestra estado de generación.
4. El panel devuelve:
   - sugerencia
   - confianza
   - fuentes
   - riesgos
   - advertencias
5. Agente revisa.
6. Decide:
   - aceptar y editar
   - descartar
   - regenerar
   - marcar útil/no útil

### Estados
- Sin contexto suficiente.
- Baja confianza.
- Riesgo de alucinación.
- Posible prompt injection.
- Límite de uso alcanzado.

---

## 5.4 Agente responde con sugerencia editada

### Flujo
1. Agente solicita “sugerir respuesta”.
2. LLM genera borrador.
3. El borrador se inserta en composer como editable.
4. Agente modifica texto.
5. Revisa PII y tono.
6. Envía respuesta pública.
7. Backend registra:
   - sugerencia usada
   - si fue editada
   - ID de sugerencia
   - usuario
   - tenant
   - ticket

### Reglas
- Nunca enviar automáticamente.
- Composer siempre editable.
- Si hay riesgo alto, bloquear one-click apply.
- Mostrar advertencia si el borrador contiene PII.

---

## 5.5 Supervisor revisa tickets en riesgo

### Flujo
1. Entra a dashboard.
2. Ve widgets:
   - tickets vencidos
   - en riesgo de SLA
   - sin asignar
   - alta prioridad
3. Hace click en un segmento.
4. La bandeja ya viene filtrada por URL.
5. Revisa tickets.
6. Ejecuta bulk actions:
   - asignar
   - priorizar
   - cambiar estado
   - etiquetar

### Estados
- Sin tickets en riesgo: empty state positivo.
- Permisos insuficientes para bulk: acción deshabilitada.
- Error parcial en bulk: mostrar detalle.

---

## 5.6 Administrador gestiona usuarios y roles

### Flujo
1. Entra a `/tenant/[slug]/admin/users`.
2. Invita o edita usuario.
3. Asigna rol y equipos.
4. Define permisos específicos si aplica.
5. Guarda.
6. Backend registra auditoría.

### Acciones
- Invitar
- Desactivar
- Cambiar rol
- Reasignar tickets si se desactiva un agente
- Requerir MFA

### Estados
- Usuario ya existe.
- Rol incompatible.
- Último admin activo no puede ser desactivado.
- Error de validación.

---

## 5.7 Auditor revisa eventos

### Flujo
1. Entra a `/tenant/[slug]/audit`.
2. Filtra por:
   - usuario
   - acción
   - entidad
   - fecha
   - tipo de evento
   - LLM
   - PII
3. Abre detalle de evento.
4. Revisa payload permitido.
5. Exporta si tiene permiso.

### Estados
- Sin resultados.
- Exportación bloqueada por política.
- Evento con PII redactada.
- Acceso denegado.

---

# 6. Diseño visual y UX

## 6.1 Estilo general

Propongo un estilo:
- enterprise SaaS
- limpio
- sobrio
- alta legibilidad
- densidad media/alta
- foco operativo

La app debe parecer una herramienta profesional de trabajo diario, no una landing ni un panel decorativo.

---

## 6.2 Principios visuales

1. **Claridad antes que adornos**
2. **Densidad controlada**
3. **Estados siempre visibles**
4. **Acciones destructivas con confirmación**
5. **PII claramente señalizada**
6. **LLM visualmente diferenciado**
7. **Modo oscuro de primera calidad**

---

## 6.3 Paleta semántica recomendada

### Estados de ticket
- Open: azul
- Pending: ámbar
- Waiting customer: gris azulado
- Solved: verde
- Closed: gris

### Prioridad
- Urgent: rojo
- High: naranja
- Medium: ámbar
- Low: gris/azulado

### SLA
- OK: verde
- At risk: ámbar
- Breached: rojo

### Riesgo / seguridad
- PII detectada: rojo suave o naranja con ícono de candado
- Prompt injection: rojo o magenta con advertencia
- Low confidence: ámbar
- High confidence: verde suave
- LLM: violeta o índigo suave

### Contenido
- Mensaje cliente: fondo neutro
- Mensaje agente: fondo azul/gris claro
- Nota interna: fondo ámbar muy suave
- Sugerencia LLM: borde violeta, fondo muy tenue
- Respuesta aprobada: badge verde

---

## 6.4 Densidad y layout

### Desktop
- Sidebar fija colapsable.
- Topbar con búsqueda global, tenant switcher y usuario.
- Contenido con paneles divididos.
- Ticket detail: conversación a la izquierda, metadata y LLM a la derecha.

### Tablet
- Sidebar colapsada.
- Panel LLM como drawer.
- Tablas con scroll horizontal controlado.

### Densidad
- Toggle compact/comfortable opcional.
- Filas de tabla compactas.
- Buen espaciado vertical en conversación.

---

## 6.5 Accesibilidad

- Contraste AA mínimo.
- Focus visible consistente.
- Navegación por teclado en tablas, menús y modales.
- Roles ARIA en componentes dinámicos.
- Estados de error no depender solo de color.
- Formularios con labels y mensajes asociados.
- Confirmaciones con foco gestionado.

---

## 6.6 Estados globales de UX

Toda pantalla principal debe contemplar:

### Loading
- Skeletons por zona.
- No spinners genéricos si se puede skeletonizar.

### Empty
- Mensaje claro.
- Acción sugerida.
- Filtros activos visibles.

### Error
- Mensaje comprensible.
- Reintentar.
- Código/correlation si ayuda a soporte.

### Permiso insuficiente
- Explicar por qué no puede ver algo.
- Mostrar acción alternativa o solicitar acceso.

---

# 7. Diseño de pantallas principales

## 7.1 Login

### Objetivo
Autenticar al usuario de forma segura.

### Usuario principal
Todos los usuarios.

### Componentes
- Formulario de email/usuario y contraseña.
- Botón de ingreso.
- Enlace a recuperación.
- MFA opcional.
- Alertas de error.

### Datos
- Credenciales.
- Estado de autenticación.
- Errores de validación.

### Acciones
- Iniciar sesión.
- Ir a recuperación.
- Completar MFA.

### Estados
- Loading.
- Error de credenciales.
- MFA requerido.
- Cuenta bloqueada.
- Tenant suspendido.

### Permisos
- Público.

---

## 7.2 Selección de tenant

### Objetivo
Elegir el tenant activo si el usuario pertenece a varios.

### Usuario principal
Usuarios multi-tenant.

### Componentes
- Lista de tenants permitidos.
- Indicador de rol por tenant.
- Buscador si hay muchos.
- Botón “Continuar”.

### Datos
- Nombre de tenant.
- Slug.
- Rol del usuario.
- Estado del tenant.

### Acciones
- Seleccionar tenant.
- Cerrar sesión si eligió mal.

### Estados
- Loading.
- Sin tenants disponibles.
- Tenant inactivo.

### Permisos
- Usuario autenticado.

---

## 7.3 Dashboard

### Objetivo
Dar visión operativa rápida.

### Usuario principal
Agente, supervisor, admin.

### Componentes
- KPI cards.
- Gráficos simples de volumen.
- Listas de riesgo.
- Actividad reciente.
- Alertas LLM opcionales.

### Datos
- Tickets abiertos.
- Asignados a mí.
- Sin asignar.
- Vencidos o en riesgo SLA.
- Volumen por prioridad.
- Volumen por categoría.
- Actividad reciente.

### Acciones
- Ir a bandeja filtrada.
- Abrir ticket.
- Reasignar rápido si supervisor.

### Estados
- Loading skeleton.
- Empty state.
- Error.
- Sin permisos para ciertos widgets.

### Permisos
- Ver dashboard.
- Puede variar según rol.

---

## 7.4 Bandeja de tickets

### Objetivo
Listar y gestionar tickets de forma eficiente.

### Usuario principal
Agentes y supervisores.

### Componentes
- TicketTable.
- TicketFilters.
- SearchInput.
- BulkActionBar.
- Pagination.
- StatusBadge.
- PriorityBadge.
- SlaIndicator.
- PiiBadge.
- LlmAssistanceBadge.

### Datos
- ID
- asunto
- cliente
- estado
- prioridad
- canal
- agente
- SLA
- tags
- tenant
- updatedAt
- flags: PII, LLM, riesgo

### Acciones
- Filtrar
- buscar
- ordenar
- seleccionar
- asignar
- cambiar estado
- etiquetar
- priorizar
- abrir ticket

### Estados
- Loading.
- Empty por filtros.
- Error.
- Selección activa.
- Bulk action parcial fallida.
- Acceso denegado.

### Permisos
- Ver tickets.
- Acciones bulk solo supervisor/admin.

---

## 7.5 Detalle de ticket

### Objetivo
Resolver el ticket con contexto completo.

### Usuario principal
Agente, supervisor.

### Componentes
- ConversationThread.
- MessageBubble.
- TicketDetailPanel.
- Metadata sidebar.
- Event history.
- Attachments.
- ReplyComposer.
- InternalNoteComposer.
- LLMAssistantPanel.
- PiiMaskedField.
- AuditTrail.

### Datos
- Conversación.
- Cliente.
- Estado.
- Prioridad.
- SLA.
- Canal.
- Tags.
- Categoría.
- Tenant.
- Agente asignado.
- Historial.
- Notas internas.
- Adjuntos.
- Detecciones de PII.
- Sugerencias LLM.

### Acciones
- Responder públicamente.
- Nota interna.
- Cambiar estado.
- Cambiar prioridad.
- Asignar.
- Agregar/quitar tags.
- Adjuntar.
- Revelar PII.
- Usar LLM.

### Estados
- Loading.
- Ticket cerrado.
- Sin permiso para responder.
- PII enmascarada.
- Adjuntos pendientes de escaneo.
- Error de carga.
- Riesgo de SLA.

### Permisos
- Ver ticket.
- Responder.
- Nota interna.
- Asignar.
- Revelar PII.

---

## 7.6 Panel LLM dentro del ticket

### Objetivo
Asistir al agente sin reemplazar su criterio.

### Usuario principal
Agente, supervisor.

### Componentes
- LLMAssistantPanel.
- LLMSuggestionCard.
- ConfidenceBadge.
- SourceCitationList.
- RiskBanner.
- PromptInjectionWarning.
- SuggestionFeedback.
- UsageMeter.

### Datos
- Clasificación sugerida.
- Resumen.
- Intención.
- Idioma.
- PII detectada.
- Artículos recomendados.
- Respuesta sugerida.
- Nivel de confianza.
- Riesgos.
- Advertencias.
- Límites de uso.

### Acciones
- Clasificar.
- Resumir.
- Sugerir respuesta.
- Buscar KB.
- Aceptar y editar.
- Rechazar.
- Regenerar.
- Marcar útil/no útil.

### Estados
- Idle.
- Generating.
- Streaming.
- Success.
- Insufficient context.
- Low confidence.
- Injection suspected.
- Rate limit.
- Error.

### Permisos
- Usar LLM.
- Aceptar sugerencias.
- Ver fuentes KB.

---

## 7.7 Base de conocimiento

### Objetivo
Gestionar artículos usados en soporte.

### Usuario principal
Agentes, supervisores, admin.

### Pantallas
- Listado.
- Artículo individual.
- Editor.
- Categorías.
- Métricas básicas.

### Componentes
- ArticleList.
- ArticleCard.
- CategoryTree.
- KnowledgeArticleEditor.
- VersionHistory.
- PublicationStatusBadge.
- ArticleMetrics.

### Datos
- Título.
- Categoría.
- Tags.
- Estado.
- Versión.
- Autor.
- Fecha.
- Métricas de uso.
- Artículos relacionados.

### Acciones
- Buscar.
- Filtrar.
- Crear.
- Editar.
- Versionar.
- Publicar.
- Archivar.
- Insertar referencia en ticket.

### Estados
- Borrador.
- Publicado.
- Archivado.
- Conflictos de versión.
- Error de guardado.
- Empty state.

### Permisos
- Leer publicado.
- Crear borrador.
- Editar.
- Publicar.
- Archivar.

---

## 7.8 Administración

### Objetivo
Configurar usuarios, equipos, reglas y políticas.

### Usuario principal
Tenant admin, platform admin.

### Módulos
- Usuarios.
- Roles.
- Equipos.
- SLA.
- Canales.
- Categorías.
- Tags.
- Plantillas.
- Retención.
- LLM.
- Privacidad.

### Componentes
- UserTable.
- InviteUserDialog.
- RolePermissionMatrix.
- TeamManager.
- SlaPolicyForm.
- ChannelSettings.
- CategoryManager.
- TagManager.
- TemplateEditor.
- RetentionPolicyForm.
- LlmConfigForm.
- PrivacySettings.

### Acciones
- Invitar usuario.
- Desactivar usuario.
- Asignar rol.
- Configurar SLA.
- Gestionar tags.
- Editar plantillas.
- Definir límites LLM.
- Configurar redacción de PII.

### Estados
- Loading.
- Validation error.
- Save success.
- Conflict.
- Danger confirmations.

### Permisos
- Solo admin correspondiente.

---

## 7.9 Auditoría

### Objetivo
Revisar acciones humanas y del LLM.

### Usuario principal
Admin, auditor.

### Componentes
- AuditLogTable.
- AuditFilterBar.
- EventDetailDrawer.
- ExportDialog.

### Datos
- Usuario.
- Acción.
- Entidad.
- Tenant.
- Fecha.
- IP/contexto.
- Tipo de evento.
- Resultado.
- Evento LLM asociado.

### Acciones
- Filtrar.
- Ver detalle.
- Exportar si está permitido.

### Estados
- Loading.
- Empty.
- Export blocked.
- Error.
- Access denied.

### Permisos
- Ver auditoría.
- Exportar.

---

## 7.10 Settings personales

### Objetivo
Preferencias del usuario.

### Usuario principal
Todos los autenticados.

### Componentes
- ProfileForm.
- SecuritySettings.
- ThemePreference.
- DensityPreference.
- NotificationPreferences.

### Datos
- Nombre.
- Idioma.
- Tema.
- Densidad.
- MFA.
- Sesiones activas.

### Acciones
- Cambiar contraseña.
- Activar MFA.
- Cambiar tema.
- Cerrar sesiones.

### Estados
- Guardado exitoso.
- Error de validación.
- MFA pendiente.

### Permisos
- Usuario autenticado.

---

# 8. Sistema de componentes reutilizables

## 8.1 Layout y navegación

- `AppShell`
- `Sidebar`
- `Topbar`
- `TenantSwitcher`
- `GlobalSearch`
- `PageHeader`
- `SectionNav`
- `Breadcrumb`
- `UserMenu`
- `NotificationMenu`

---

## 8.2 Componentes de datos

- `DataTable`
- `TableToolbar`
- `SearchInput`
- `FilterPopover`
- `DateRangeFilter`
- `MultiSelectFilter`
- `Pagination`
- `BulkActionBar`
- `EmptyState`
- `ErrorState`
- `LoadingSkeleton`
- `PermissionDeniedState`
- `ConfirmDialog`

---

## 8.3 Tickets

- `TicketTable`
- `TicketRow`
- `StatusBadge`
- `PriorityBadge`
- `ChannelBadge`
- `SlaIndicator`
- `TagChips`
- `AssigneeSelect`
- `CategorySelect`
- `TicketMetadataCard`
- `ConversationThread`
- `MessageBubble`
- `InternalNoteComposer`
- `ReplyComposer`
- `AttachmentList`
- `AttachmentPreview`
- `TicketEventTimeline`
- `PiiMaskedField`
- `PiiRevealDialog`

---

## 8.4 LLM

- `LLMAssistantPanel`
- `LLMSuggestionCard`
- `ConfidenceBadge`
- `RiskBanner`
- `PromptInjectionWarning`
- `SourceCitationList`
- `SuggestionActions`
- `SuggestionFeedback`
- `LlmUsageMeter`
- `DraftIndicator`
- `ModelDisclaimer`

---

## 8.5 Knowledge Base

- `ArticleList`
- `ArticleCard`
- `ArticleStatusBadge`
- `CategoryTree`
- `KnowledgeArticleEditor`
- `MarkdownToolbar`
- `VersionHistory`
- `DiffViewer`
- `ArticleMetrics`
- `RelatedArticles`

---

## 8.6 Administración

- `UserTable`
- `InviteUserDialog`
- `RolePermissionMatrix`
- `TeamManager`
- `SlaPolicyForm`
- `ChannelConfigForm`
- `CategoryManager`
- `TagManager`
- `TemplateEditor`
- `RetentionPolicyForm`
- `LlmConfigForm`
- `PrivacyPolicyForm`

---

## 8.7 Auditoría

- `AuditLogTable`
- `AuditFilterBar`
- `EventDetailDrawer`
- `AuditExportDialog`
- `EventPayloadViewer`

---

## 8.8 Seguridad y estados sensibles

- `SessionExpiredModal`
- `AccessDeniedScreen`
- `DestructiveActionConfirm`
- `SensitiveDataWarning`
- `CopySanitizedButton`
- `MaskedValue`
- `RevealReasonInput`

---

# 9. Modelo de estados

## 9.1 Sesión

### Estados posibles
- `unauthenticated`
- `authenticating`
- `mfa_required`
- `authenticated`
- `refreshing`
- `expired`
- `error`

### Datos
- usuario
- tenants disponibles
- tenant activo
- permisos
- flags de seguridad

---

## 9.2 Tenant activo

### Estados posibles
- `idle`
- `loading`
- `ready`
- `forbidden`
- `not_found`
- `error`

### Datos
- tenantId
- slug
- nombre
- rol del usuario
- features habilitadas
- límites LLM

---

## 9.3 Permisos

### Fuente
Backend vía `/me` o endpoint de permisos por tenant.

### Estado
- `loading`
- `ready`
- `error`

### Uso
- Habilitar/deshabilitar acciones.
- Ocultar componentes.
- Mostrar estados de acceso denegado.

---

## 9.4 Lista de tickets

### Estado de query
- `idle`
- `loading`
- `success`
- `error`
- `empty`

### Estado de UI
- filtros activos
- búsqueda
- orden
- página
- selección múltiple
- bulk action en curso

---

## 9.5 Detalle de ticket

### Estados
- `loading`
- `ready`
- `not_found`
- `forbidden`
- `error`
- `closed_locked`

### Subestados
- conversación cargando
- adjuntos pendientes
- PII enmascarada/revelada
- panel LLM activo
- composer con borrador

---

## 9.6 Respuesta sugerida LLM

### Estados
- `idle`
- `preparing`
- `streaming`
- `success`
- `insufficient_context`
- `low_confidence`
- `risk_detected`
- `injection_suspected`
- `error`
- `rate_limited`

### Metadatos
- suggestionId
- modelVersion
- confidence
- sources
- edited
- feedback
- cost/tokens si aplica

---

## 9.7 Base de conocimiento

### Lista
- loading
- success
- empty
- error

### Editor
- draft
- saving
- saved
- validation_error
- version_conflict
- publishing
- published
- archived

---

## 9.8 Auditoría

### Estados
- loading
- success
- empty
- error
- exporting
- export_blocked

---

## 9.9 Errores de red

### Comportamiento
- Reintentos automáticos solo en GET idempotentes.
- Sin retry automático en mutaciones.
- Toast + estado inline si corresponde.

---

## 9.10 Token expirado

### UX recomendada
- Modal global indicando sesión vencida.
- Guardar estado de formularios no enviados si es posible.
- Redirigir a login o reautenticar silenciosamente si backend lo soporta.

---

## 9.11 Acceso denegado

### UX recomendada
- No simular “no existe” si el producto prefiere transparencia.
- Si sensibilidad alta, usar “no encontrado” para no filtrar existencia.
- Mostrar motivo general y acción de retorno.

---

# 10. Integración con backend FastAPI

## 10.1 Endpoints aproximados del backend

```text
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET /me
GET /tenants

GET /tickets
GET /tickets/{id}
POST /tickets/{id}/reply
POST /tickets/{id}/notes
POST /tickets/{id}/llm/classify
POST /tickets/{id}/llm/summarize
POST /tickets/{id}/llm/suggest-reply

GET /knowledge/articles
POST /knowledge/articles

GET /audit/events
```

---

## 10.2 Capa BFF recomendada

El frontend debería consumir rutas internas del BFF, no directamente FastAPI:

```text
POST /api/bff/auth/login
POST /api/bff/auth/refresh
POST /api/bff/auth/logout
GET  /api/bff/me
GET  /api/bff/tenants

GET  /api/bff/tenant/[tenantSlug]/tickets
GET  /api/bff/tenant/[tenantSlug]/tickets/[ticketId]
POST /api/bff/tenant/[tenantSlug]/tickets/[ticketId]/reply
POST /api/bff/tenant/[tenantSlug]/tickets/[ticketId]/notes
POST /api/bff/tenant/[tenantSlug]/tickets/[ticketId]/llm/classify
POST /api/bff/tenant/[tenantSlug]/tickets/[ticketId]/llm/summarize
POST /api/bff/tenant/[tenantSlug]/tickets/[ticketId]/llm/suggest-reply

GET  /api/bff/tenant/[tenantSlug]/knowledge/articles
POST /api/bff/tenant/[tenantSlug]/knowledge/articles

GET  /api/bff/tenant/[tenantSlug]/audit/events
```

### Responsabilidad del BFF
- Validar sesión.
- Validar tenant.
- Adjuntar Authorization a FastAPI.
- Manejar refresh.
- Traducir errores.
- Aplicar rate limiting básico si corresponde.
- Registrar correlation ID.

---

## 10.3 Fetching

### Para lecturas interactivas
- TanStack Query.
- Query keys por tenant y filtros.

### Para streaming LLM
- Fetch con ReadableStream desde Route Handler.
- AbortController para cancelar.
- UI con estado `streaming`.

### Para cargas iniciales
- Server Components puede precargar datos no sensibles.
- Para datos sensibles, mejor fetch en cliente vía BFF con control explícito.

---

## 10.4 Caché

### Recomendación
- Tickets: poca caché, `staleTime` bajo.
- KB publicada: puede cachear más.
- Permisos: cache por request o corto tiempo.
- Auditoría: sin caché agresiva.

### Query keys sugeridas
- `['tenant', tenantSlug, 'tickets', filters]`
- `['tenant', tenantSlug, 'ticket', ticketId]`
- `['tenant', tenantSlug, 'knowledge', filters]`
- `['tenant', tenantSlug, 'audit', filters]`

---

## 10.5 Invalidación

### Después de mutaciones
- Responder ticket:
  - invalidar detalle de ticket.
  - invalidar conversation thread.
  - invalidar actividad reciente.
- Cambio de estado/prioridad/asignación:
  - invalidar lista de tickets.
  - invalidar detalle.
- Bulk actions:
  - invalidar list query actual.
  - invalidar selección.
- Crear/editar artículo:
  - invalidar KB list.
  - invalidar artículo.

---

## 10.6 Optimistic updates

### Recomendación
Usar optimistic updates con cautela.

### Buenos candidatos
- Agregar/quitar tags.
- Marcar feedback LLM.
- Cambios de UI local.

### Candidatos con cuidado
- Cambio de estado.
- Asignación.
- Envío de respuesta.

### Patrón sugerido
- Mostrar pending state.
- Confirmar con backend.
- Rollback si falla.

---

## 10.7 Paginación

### Bandeja de tickets
Recomiendo **paginación clásica** en vez de infinite scroll.

Razones:
- Selección múltiple más estable.
- Bulk actions más claras.
- Menos ambigüedad de posición.
- Mejor para auditoría visual.

### Conversation thread
- Cargar últimos mensajes primero.
- Botón o scroll para cargar anteriores.
- Infinite scroll solo si no compite con acciones críticas.

### Auditoría
- Paginación clásica.

---

## 10.8 Filtros en URL

Los filtros deben vivir en search params.

Ejemplo conceptual:
- `/tenant/acme/tickets?status=open&priority=urgent&page=2`

Beneficios:
- Compartibles.
- Restaurables.
- Compatibles con back button.
- Permiten deep links operativos.

### Reglas
- Parsear con Zod.
- Sincronizar con TanStack Query.
- Debounce para búsqueda de texto.
- Reset de filtros visible.

---

## 10.9 Errores, reintentos y abort controllers

### Reintentos
- GET: retry limitado con backoff.
- Mutations: no retry automático.
- 401: no retry directo, intentar refresh.
- 403/404: no retry.

### Abort controllers
- Cancelar query anterior al cambiar filtros.
- Cancelar streaming LLM al cerrar panel.
- Cancelar requests al desmontar componente.

---

# 11. Seguridad frontend

## 11.1 Protección de rutas

### Capas
1. Middleware para sesión y tenant básico.
2. Server guard en layouts/páginas.
3. Autorización en BFF.
4. Autorización final en backend.

### Regla clave
La UI puede ocultar acciones, pero nunca ser la única barrera.

---

## 11.2 Manejo de tokens

### Recomendación
- Access token y refresh token en cookies HttpOnly.
- JavaScript no debe poder leerlos.
- No usar localStorage para tokens.
- No mostrar tokens en URL.
- No loggear tokens en cliente.

---

## 11.3 Almacenamiento seguro

### No guardar
- tokens
- secretos
- PII sensible
- payloads LLM completos si no es necesario

### Si se necesita storage local
Solo para preferencias UI:
- tema
- densidad
- sidebar colapsada

---

## 11.4 Prevención de XSS

### Medidas
- Escape automático de React.
- Evitar `dangerouslySetInnerHTML` salvo necesidad explícita.
- Sanitizar HTML de KB si se renderiza rich text.
- CSP estricta.
- No renderizar contenido del cliente como HTML confiable.
- No ejecutar scripts desde mensajes.

---

## 11.5 Manejo de PII

### UX recomendada
- Enmascarar por defecto.
- Mostrar badge de “datos sensibles”.
- Revelado explícito con permiso.
- Confirmación y motivo opcional.
- Auditoría del revelado.

### Prevención de fuga
- Desalentar copia directa de campos sensibles.
- Ofrecer copia redactada.
- Advertir si se intenta copiar conversación con PII.
- No autocompletar PII en formularios innecesarios.
- No precargar PII en prompts LLM si política indica redacción.

---

## 11.6 Controles contra prompt injection

### Diseño
- Contenido del cliente mostrado como input no confiable.
- Estilo visual que lo diferencia de instrucciones internas.
- No ejecutar comandos detectados dentro de mensajes.
- Si el LLM detecta posible injection:
  - mostrar warning.
  - bajar confianza.
  - bloquear “apply” automático.
  - requerir revisión manual reforzada.

### Reglas
- No interpretar texto del cliente como instrucción de sistema.
- No permitir que una sugerencia LLM ejecute acciones administrativas.
- Mostrar riesgo en banner visible.

---

## 11.7 Auditoría de acciones

### Eventos a auditar desde frontend
- Login/logout.
- Selección de tenant.
- Respuesta enviada.
- Nota interna creada.
- Cambio de estado.
- Cambio de asignación.
- Bulk action.
- Revelado de PII.
- Exportación.
- Sugerencia LLM aceptada.
- Sugerencia LLM rechazada.
- Feedback LLM.
- Edición de artículo.
- Publicación de artículo.
- Cambios de configuración.

### Dato útil para auditoría
- ID de entidad.
- Tenant.
- Usuario.
- Acción.
- Resultado.
- Contexto UI.
- SuggestionId si aplica.

---

## 11.8 Autorización por tenant

### Controles
- URL scoping.
- Tenant switcher limitado.
- BFF valida membresía.
- Backend valida acceso al recurso.
- Cache de queries separada por tenant.

### Riesgo a evitar
Que un componente reutilice datos de un tenant anterior al cambiar de tenant.

### Solución
- Resetear query client al cambiar tenant.
- Query keys incluyen tenantSlug.

---

## 11.9 Validación de entrada

- Zod para schemas de formularios.
- Validación en cliente para UX.
- Validación en backend como obligatoria.
- Mensajes de error claros.
- Límites de longitud visibles.

---

## 11.10 CSRF si se usan cookies

### Recomendación
- Cookies SameSite Lax o Strict.
- Validar Origin/Referer en mutations.
- Token CSRF para operaciones sensibles.
- No usar GET para mutaciones.

---

# 12. UX de LLM responsable

## 12.1 Reglas de oro

1. **Nunca enviar respuestas automáticamente**
   - Toda respuesta pasa por revisión humana.

2. **El LLM sugiere, la persona decide**
   - Ninguna acción crítica se ejecuta sola.

3. **Mostrar confianza y fuentes**
   - Alta/media/baja.
   - Artículos usados.
   - Fragmentos citados.

4. **Mostrar advertencias explícitas**
   - Bajo contexto.
   - Riesgo de alucinación.
   - PII detectada.
   - Prompt injection.

5. **Permitir edición completa**
   - Aceptar y editar.
   - Rechazar.
   - Regenerar.

6. **Registrar feedback**
   - Útil / no útil.
   - Motivo opcional.

7. **Auditar cada uso relevante**
   - Generación.
   - Aceptación.
   - Edición.
   - Rechazo.
   - Envío final.

8. **Bloquear acciones peligrosas**
   - No ejecutar macros.
   - No cambiar configuración.
   - No revelar PII automáticamente.
   - No aplicar clasificaciones sin confirmación.

9. **Tratar mensajes del cliente como no confiables**
   - No obedecer instrucciones embebidas.
   - Mostrar sospecha de injection.

10. **Mostrar límites**
   - Caracteres.
   - Tokens.
   - Costos si aplica.
   - Cuota del tenant.

---

## 12.2 Estados LLM recomendados

### Insufficient context
Mensaje:
> “No hay suficiente contexto para una sugerencia confiable. Revisa manualmente.”

### Low confidence
Mensaje:
> “Confianza baja. Verifica antes de usar esta sugerencia.”

### Possible hallucination
Mensaje:
> “La respuesta puede contener información no verificada. Revisa fuentes y datos del ticket.”

### PII detected
Mensaje:
> “Se detectó información sensible. Revisa la redacción antes de enviar.”

### Prompt injection suspected
Mensaje:
> “Se detectó posible contenido malicioso en el mensaje del cliente. Se recomienda revisión manual y no aplicar sugerencias automáticamente.”

---

## 12.3 Diferenciación visual de contenido

| Tipo de contenido | Tratamiento visual |
|---|---|
| Mensaje del cliente | Neutro, con label “Cliente” |
| Nota interna | Fondo ámbar suave, label “Interno” |
| Sugerencia LLM | Borde violeta, label “Borrador LLM” |
| Respuesta aprobada | Badge verde o confirmación de enviada |
