# Tasks: Correcciones del detalle de ticket (lado agente)

Feature **015** — implementar de a una, actualizando el estado aquí.

## Rutas de navegación (puntos 5 y 6)
- [x] T1 · "Volver a tickets" usa `/${slug}/app/tickets` (`[ticketId]/page.tsx`)
- [x] T2 · `knowledge/page.tsx` redirige a `/${slug}/app/knowledge/articles`
- [x] T3 · `app/page.tsx` redirige a `/${slug}/app/tickets` y `admin/page.tsx` a `/${slug}/app/admin/users`
- [x] T4 · Backlinks de knowledge (categories, articleId, new) con slug
- [x] T5 · `AuditEventsView.tsx` usa slug en `router.push` (líneas 102/109)

## Header superior (punto 3)
- [x] T6 · Header `w-full` debajo de "Volver a tickets": `flex justify-between` con `flex col { #id, nombre, detalle }` + botón "Cerrar ticket" (confirmación con `useCloseTicket`)

## Propiedades del ticket (punto 2)
- [x] T7 · `TicketPropertiesCard` reorganizado como `ticket-props.html` (rows label + valor/select)
- [x] T8 · Selects editables: Estado, Prioridad (reusan `STATUS_LABELS`/`PRIORITY_LABELS` + `useUpdateTicket`)
- [x] T9 · Select "Agente" (Sin asignar / asignarme, lógica `toggleAssignment`)
- [x] T10 · Textos: Categoría (`categoryLabel`), Tenant (nombre empresa); Canal si el modelo lo tiene, si no se omite
- [x] T11 · Quitar del chat (header central) los selects de Estado/Prioridad de `TicketActions`

## Panel "Asistente IA" (punto 4)
- [ ] T12 · Renombrar "Asistente LLM" → "Asistente IA"
- [ ] T13 · Quitar `ConfidenceBadge` (confianza) de las secciones
- [ ] T14 · Clasificación/Resumen pre-completados (desde `GET /v1/ai/tickets/{id}/suggestions`) con botones Editar y Regenerar
- [ ] T15 · Respuesta sugerida: solo "Regenerar" y "Usar como respuesta" (sin lista de botones final)

## Cierre
- [ ] T16 · `pnpm lint` sin warnings y `pnpm typecheck` OK
- [ ] T17 · Verificación manual como agente en `/acme-corp/app/tickets/11` (navegación sin login, header, props, panel IA)
- [ ] T18 · Documentar en `ia-docs/init/changes.md` y mover a "Hecho" en `constitution/roadmap.md`
