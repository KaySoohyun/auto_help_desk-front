# Plan: Correcciones del detalle de ticket (lado agente) — errores 7 a 11 (feature 017)

Feature **017** (`ia-docs/features/017-correcciones-agente-detalle/`).

## Enfoque
Corregir los errores 7 a 11 de `errores.md`, todos del flujo del agente. Los errores 8–11 son de
UI (frontend puro); el **error 7 (tags) requiere backend nuevo** y se deja **al último**.

## Orden de trabajo (de menor a mayor riesgo)
1. **Error 8** · Ocultar "Nueva categoría" para el agente en la página de Categorías de KB (frontend).
2. **Error 9** · Propiedades: email del agente que no desborde + spacing compacto entre rows (frontend).
3. **Error 10** · Burbujas de chat con tope de 3/4 y alineación cliente/agente (frontend).
4. **Error 11** · Nombres del chat en negrita (frontend).
5. **Error 7 (al último)** · Tags: botón en el header de la card + autosuggest + crear nueva
   (frontend + backend).
6. **Validación y cierre** · lint/typecheck en verde; backend pytest; verificación manual.

## Decisiones técnicas
- **Error 8** · Reutilizar `hasKbPermission(role, "kb:edit")` (ya existe). En la página de Categorías
  (Server Component) envolver el `CreateCategoryDialog` en un componente client que lea el rol.
- **Error 9** · El trigger del Agente: `w-full`/`max-w` con `truncate`; ajustar `PropertyRow` y el
  spacing del contenedor (reducir `space-y` o `min-h` para rows de texto).
- **Error 10** · Copiar el patrón de burbujas de `PersonaTicketDetail.tsx` (`max-w-[75%]`,
  `justify-start`/`justify-end`). Determinar cliente vs agente con el `author_id` disponible
  (`TicketMessage.author_id`); mantener el caso "Sistema".
- **Error 11** · `font-medium` → `font-bold` en el autor.
- **Error 7** · Modelo: input de autosuggest que a ≥3 caracteres consulta un nuevo endpoint de
  búsqueda de tags; permite seleccionar una existente (asocia por id) o crear una nueva (nuevo
  endpoint `POST /tags` con `TagCreate`). Requiere BFF y hooks nuevos.

## Archivos a tocar (tentativos)
Frontend:
- `src/app/[slug]/app/knowledge/categories/page.tsx` — condicionar creación por rol (error 8).
- `src/components/features/tickets/TicketPropertiesCard.tsx` — ancho Agente + spacing (error 9).
- `src/components/features/tickets/TicketThread.tsx` — burbujas + negrita (errores 10, 11).
- `src/components/features/tickets/TicketTagsCard.tsx` — header + autosuggest + crear (error 7).
- Nuevos BFF y hooks de tags (buscar/crear) para el error 7.
Backend (solo error 7):
- Endpoints de listar/buscar tags y crear tag (reutilizando `TagCreate`), en `app/api/routes_tickets.py`.

## Validación
- Frontend: `pnpm lint` (sin warnings) y `pnpm typecheck`.
- Backend (error 7): `.venv/bin/python -m pytest -q` en verde.
- Verificación manual como agente en `/acme-corp/app/tickets/11` y módulo KB.
- Documentar en `ia-docs/init/changes.md` (+ backend `cambios.md` para el 7) y mover a "Hecho" en
  `roadmap.md`.
