# Tasks: Correcciones del detalle de ticket (lado agente) — errores 7 a 11 (feature 017)

Feature **017** — implementar de a una, actualizando el estado aquí. Esperar OK del usuario antes de tocar código.

## Error 8 · Botón "Nueva categoría" visible para el agente (frontend)
- [ ] T1 · En `categories/page.tsx` condicionar `CreateCategoryDialog` a `kb:edit` (componente client con `useSessionStore` + `hasKbPermission`). El agente (`kb:read`) no debe verlo.

## Error 9 · Propiedades: email desbordado + spacing (frontend)
- [ ] T2 · `TicketPropertiesCard.tsx`: el select "Agente" no debe desbordar (ancho responsive/clamp + truncate del email).
- [ ] T3 · `TicketPropertiesCard.tsx`: reducir el espacio vertical entre rows (especialmente las rows de texto sin selects).

## Error 10 · Burbujas de chat con tope de ancho y alineación (frontend)
- [ ] T4 · `TicketThread.tsx` `MessageItem`: burbujas `max-w-[75%]`; cliente a la izquierda (`justify-start`), agente a la derecha (`justify-end`). Patrón: `PersonaTicketDetail.tsx`.

## Error 11 · Nombres del chat en negrita (frontend)
- [ ] T5 · `TicketThread.tsx`: el autor del mensaje usa `font-bold` (hoy `font-medium`).

## Error 7 · Tags: header + autosuggest + crear nueva (frontend + backend) — AL ÚLTIMO
- [ ] T6 · `TicketTagsCard.tsx`: mover el botón de agregar tag al `CardHeader` a la altura del título "Tags".
- [ ] T7 · Backend: endpoint para **buscar/listar tags** por subcadena (p. ej. `GET /v1/tags?search=...`).
- [ ] T8 · Backend: endpoint para **crear una tag** (`POST /v1/tags` con `TagCreate`).
- [ ] T9 · BFF de los nuevos endpoints de tags (listar/buscar y crear) en `src/app/api/bff/`.
- [ ] T10 · Hooks frontend para buscar tags y crear tag.
- [ ] T11 · `TicketTagsCard.tsx`: input con autosuggest que a ≥3 letras trae tags coincidentes; se puede elegir una existente o crear una nueva.

## Cierre
- [ ] T12 · `pnpm lint` sin warnings y `pnpm typecheck` OK.
- [ ] T13 · Backend `pytest` en verde (por el punto 7).
- [ ] T14 · Verificación manual como agente en `/acme-corp/app/tickets/11` + módulo KB.
- [ ] T15 · Documentar en `changes.md` (frontend) y backend `cambios.md`; mover a "Hecho" en `roadmap.md`.
