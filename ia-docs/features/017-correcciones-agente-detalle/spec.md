# Spec: Correcciones del detalle de ticket (lado agente) — errores 7 a 11

## 1. Nombre de la feature
**017 · Correcciones del detalle de ticket del agente — errores 7 a 11 listados en `errores.md`.**

## 2. Contexto
En `errores.md` se registraron 5 errores nuevos (puntos 7 a 11) sobre el flujo del agente
(`/acme-corp/app/tickets/11` y módulos relacionados). Se agrupan en una sola feature para
mantener el contexto del detalle del ticket. La **errores 7 se aborda al último** por requerir
backend nuevo.

## 3. Errores y diagnóstico

### Error 8 · El agente ve el botón "Nueva categoría"
- **Dónde**: `src/app/[slug]/app/knowledge/categories/page.tsx` renderiza `<CreateCategoryDialog />`
  **sin chequear rol**. En `ArticlesPageView.tsx:78` el mismo botón sí está condicionado a
  `canEdit` (`hasKbPermission(role, "kb:edit")`).
- **Rol**: el agente tiene `kb:read` (sin `kb:edit`) → no debería poder crear categorías.
- **Fix (frontend)**: condicionar la creación de categoría a `kb:edit` en la página de Categorías
  (componente client que lee el rol vía `useSessionStore` + `hasKbPermission`).

### Error 9 · Propiedades: email del agente desborda + demasiado espacio entre rows
- **Dónde**: `src/components/features/tickets/TicketPropertiesCard.tsx`.
- **Problema 1**: el `Select` de "Agente" usa `SelectTrigger className="w-40"` y muestra
  `user?.email` (largo) → desborda el botón fijo.
- **Problema 2**: las rows de texto (Tenant/Creado/Actualizado) usan `PropertyRow` con `min-h-9`
  y el contenedor `space-y-3.5` → demasiado espacio vertical en rows sin selects.
- **Fix (frontend)**: ancho responsive/clamp en el trigger del Agente (p. ej. `max-w` + truncate),
  y spacing vertical menor/ajustado entre rows de texto.

### Error 10 · Burbujas de chat con límite de ancho y alineación
- **Dónde**: `src/components/features/tickets/TicketThread.tsx` (`MessageItem`).
- **Problema**: los mensajes no tienen `max-w-[75%]` ni alineación izquierda/derecha; todos van en
  una columna con borde/fondo de card.
- **Referencia correcta existente**: `PersonaTicketDetail.tsx:174-207` (chat del cliente) usa
  `max-w-[75%]`, `justify-start` (cliente) / `justify-end` (agente) y burbujas redondeadas
  condicionales.
- **Fix (frontend)**: rehacer `MessageItem` con burbujas `max-w-[75%]`, alineadas a la izquierda
  para el cliente y a la derecha para el agente.

### Error 11 · Nombres en el chat en negrita
- **Dónde**: `src/components/features/tickets/TicketThread.tsx` `MessageItem` (`<span className="font-medium">`).
- **Fix (frontend)**: `font-medium` → `font-bold`.

### Error 7 (al último) · Tags: header + autosuggest + crear nueva
- **Dónde**: `src/components/features/tickets/TicketTagsCard.tsx`.
- **Problema 1**: el botón "Agregar tag" está en el `CardContent`, no en el `CardHeader` a la altura
  del título "Tags".
- **Problema 2**: el input agrega la tag **por id numérico** (`useAddTicketTag` con `{tag_id}`);
  no hay búsqueda ni creación.
- **Estado actual de endpoints**: existen `GET /tickets/{id}/tags`, `POST /tickets/{id}/tags`
  (asocia tag por id, solo tags existentes) y `DELETE /tickets/{id}/tags/{tagId}`. **No existen**:
  buscar tags por subcadena ni crear una tag nueva (el schema `TagCreate` existe pero no tiene
  endpoint que lo use).
- **Fix (frontend + backend)**: input con autosuggest (busca tags que contengan las letras tipeadas
  desde 3 caracteres) y permitir crear una tag nueva. Requiere: endpoints backend para listar/buscar
  tags y crear tags + sus BFF + hooks frontend + UI de autosuggest.

## 4. Alcance
### 4.1 In scope
- Frontend: errores 8, 9, 10 y 11 (puramente UI, bajo riesgo).
- Frontend + Backend: error 7 (tags con autosuggest y creación).

### 4.2 Out of scope
- No se cambia el modelo de datos de tickets ni permisos de backend como tal (solo se usa el permiso
  existente `kb:edit` para ocultar UI).
- No se tocan los errores 1 a 6 (ya resueltos o en otra feature).

## 5. Criterios de aceptación
- Como **agente** en `/acme-corp/app/tickets/11`:
  - La página de Categorías de KB no muestra "Nueva categoría" (solo lectura).
  - En Propiedades, el email del agente no desborda el botón y el espaciado entre rows es compacto.
  - El chat muestra burbujas con tope de 3/4 del ancho, cliente a la izquierda y agente a la derecha.
  - Los nombres en el chat están en negrita.
  - La card de Tags (crear/editar otro ticket) tiene el botón en el header y un input de búsqueda que
    sugiere tags existentes (desde 3 letras) y permite crear una nueva.
- `pnpm lint` sin warnings y `pnpm typecheck` OK; backend `pytest` en verde (para el punto 7).
