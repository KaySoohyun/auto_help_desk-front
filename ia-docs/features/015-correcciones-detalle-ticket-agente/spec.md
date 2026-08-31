# Spec: Correcciones del detalle de ticket (lado agente)

## 1. Nombre de la feature
**Correcciones del detalle de ticket para el agente** — reorganización del detalle, panel de Propiedades, header superior, panel "Asistente IA" y arreglo de navegación.

## 2. Contexto y problema
El usuario navegó como agente (`/acme-corp/app/tickets/11`) y reportó una serie de errores y mejoras, todos **del lado del agente** (no del portal del cliente). El archivo `errores.md` en la raíz del repo lista los hallazgos. A esto se suma un documento de referencia de UI `ticket-props.html` (también en la raíz) que define cómo deben verse las "Propiedades" del ticket.

Problemas detectados:
1. **Duda (no bug)** — el agente puede ver/asignarse tickets asignados a otro agente. Verificado: el modelo de datos tiene un solo `assignee_id`; es el comportamiento esperado. **No se toca.**
2. **Propiedades del ticket** — deben verse como `ticket-props.html` (rows con label + valor/select) reutilizando los selects que hoy viven en el chat, y **sin** los botones extras del chat.
3. **Header superior** — debajo de "Volver a tickets" debe ir un `div w-full` con `id`/nombre/detalle a la izquierda y botón "Cerrar ticket" a la derecha; el resto de la pantalla abajo.
4. **Panel IA** — renombrar "Asistente LLM" → "Asistente IA"; quitar la confianza; clasificación/resumen pre-completados con botones Editar/Regenerar; respuesta sugerida solo con "Regenerar" y "Usar como respuesta" (sin la lista de botones final).
5. **"Volver a tickets" redirige al login** — causa raíz: el enlace usa `/app/tickets` sin el slug del tenant; el proxy lo atrapa como ruta legacy y redirige a `/`.
6. **"Conocimiento" redirige al login** — misma causa raíz: `redirect("/app/knowledge/articles")` sin slug.

## 3. Causa raíz de 5 y 6 (navegación → login)
El modelo de sesión/tenant está **scopeado por URL** (`/[tenantSlug]/app/...`). Tanto `src/proxy.ts` como el detector de sesión expirada derivan el slug del primer segmento del pathname.

`src/proxy.ts` (líneas 27-40) atrapa cualquier ruta legacy sin slug (`/app/...`, `/panel/...`, etc., específicamente `pathname.startsWith("/app/")` en la línea 33) y la redirige a la landing `/`. En `/` no hay slug → no se resuelve el tenant → se pierde el contexto de sesión → login.

Por eso, **todo enlace/redirect interno de la zona autenticada debe incluir `/${slug}`**.

## 4. Alcance

### 4.1 In scope
- Reorganizar el detalle de ticket del agente (`TicketDetailView`) según los puntos 2, 3 y 4.
- Corregir la navegación interna (puntos 5 y 6) reemplazando rutas legacy sin slug por rutas con slug.
- Persistir cambios de Estado, Prioridad y Agente desde el panel de Propiedades (reutilizando `useUpdateTicket`).
- Panel "Asistente IA" simplificado.

### 4.2 Out of scope
- **No** se cambia el modelo de datos multi-agente (el punto 1 es solo una duda, no un bug).
- **No** se toca el portal del cliente ni el backend FastAPI (todo es frontend).
- **No** se añade el campo "Canal" si no existe en el modelo (se decide en implementación; de no existir, se omite o se muestra el valor real).

## 5. Requisitos funcionales

### FR-01 · Header superior del ticket (punto 3)
- Debajo del `BackLink` "Volver a tickets" va un `div` de ancho completo.
- `flex row justify-between`: izquierda `flex col` con `#{id}`, nombre (asunto) y detalle (descripción); derecha botón **"Cerrar ticket"** (con confirmación, reusando `useCloseTicket`).
- El resto de la pantalla (grid de columnas) queda debajo.

### FR-02 · Propiedades del ticket (punto 2)
- `TicketPropertiesCard` se reorganiza como `ticket-props.html`: rows `label` + valor/select.
- Campos **editables** (selects) reutilizando los datos/lógica del chat:
  - **Estado** → `STATUS_LABELS` + `useUpdateTicket`.
  - **Prioridad** → `PRIORITY_LABELS` + `useUpdateTicket`.
  - **Agente** → "Sin asignar" / agente actual (lógica `toggleAssignment` de `TicketDetailView`).
- Campos de **solo texto**:
  - **Canal** (si el modelo tiene el dato; si no, omitir o valor real).
  - **Categoría** → `categoryLabel`.
  - **Tenant** → nombre de la empresa/tenant.
- Se **eliminan** del chat (header central) los selects de Estado/Prioridad de `TicketActions` (pasaron a Propiedades).

### FR-03 · Panel "Asistente IA" (punto 4)
- Título: "Asistente LLM" → **"Asistente IA"**.
- Se quita la confianza (`ConfidenceBadge`) de las secciones.
- **Clasificación sugerida** y **Resumen**: contenido pre-completado (persistido, `GET /v1/ai/tickets/{id}/suggestions`) con botones **Editar** y **Regenerar**.
- **Respuesta sugerida**: sin la lista de botones final; solo botón **"Regenerar"** y **"Usar como respuesta"**.

### FR-04 · Navegación interna con slug (puntos 5 y 6)
- Todos los enlaces/redirects internos de la zona autenticada usan `/${slug}`:
  - `[ticketId]/page.tsx` → "Volver a tickets" → `/${slug}/app/tickets`.
  - `knowledge/page.tsx` → `redirect(/ ${slug}/app/knowledge/articles)`.
  - `app/page.tsx` → `redirect(/ ${slug}/app/tickets)`.
  - `admin/page.tsx` → `redirect(/ ${slug}/app/admin/users)`.
  - `knowledge/categories/page.tsx`, `knowledge/articles/[articleId]/page.tsx`, `knowledge/articles/new/page.tsx` → backlinks con slug.
  - `AuditEventsView.tsx` → `router.push(...)` con slug (líneas 102/109).

## 6. Criterios de aceptación
- Navegando como agente en `/acme-corp/app/tickets/11`:
  - "Volver a tickets" lleva a `/${slug}/app/tickets` sin pasar por login.
  - "Conocimiento" lleva a `/${slug}/app/knowledge/articles` sin pasar por login.
  - El header superior muestra id/nombre/detalle + botón "Cerrar ticket".
  - Propiedades muestra selects editables (Estado/Prioridad/Agente) que persisten y textos (Categoría/Tenant/Canal si aplica).
  - El chat ya no muestra los selects/botones extras de Estado/Prioridad.
  - El panel se llama "Asistente IA", sin confianza, con contenido pre-cargado y botones Editar/Regenerar (clasificación/resumen) y Regenerar/Usar como respuesta (respuesta).
- `pnpm lint` sin warnings y `pnpm typecheck` OK.

## 7. Riesgos y mitigaciones
| Riesgo | Mitigación |
|---|---|
| Romper navegación al quitar slug | Cambiar TODOS los enlaces legacy detectados y verificar manualmente ambas rutas |
| Propiedades pierde datos si el modelo no expone Canal | Omitir el campo Canal si el tipo de ticket no lo tiene |
| Panel IA sin sugerencias persistidas | Devolver el estado "sin sugerencias" y permitir generar con Regenerar |
| Confianza: el usuario pidió quitarla | Eliminar `ConfidenceBadge` del panel IA (no del resto de la app) |
