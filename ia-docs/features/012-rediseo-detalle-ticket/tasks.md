# Tareas — Feature 012 Rediseño del detalle de ticket

## Fase 1: Backend — Modelos de datos

- [ ] **T1.1** Crear tabla `tenants` (`id`, `name`, `slug`, `created_at`) + modelo SQLAlchemy + schema Pydantic
- [ ] **T1.2** Seed de tenants de prueba (al menos 2: "test-tenant", "acme-corp")
- [ ] **T1.3** Crear tabla `customers` (`id`, `tenant_id` FK, `name`, `email`, `company`, `plan`, `created_at`) + modelo + schema
- [ ] **T1.4** Seed de customers de prueba (al menos 3 por tenant)
- [ ] **T1.5** Crear tabla `user_tenants` (`user_id` FK, `tenant_id` FK, `role`, `created_at`) + modelo + schema
- [ ] **T1.6** Migrar datos: `users.tenant_id` → `user_tenants` (script de migración)
- [ ] **T1.7** Eliminar columna `tenant_id` de tabla `users` (después de migración)
- [ ] **T1.8** Agregar FK `customer_id` en tabla `tickets` (nullable) + actualizar modelo
- [ ] **T1.9** Crear tabla `ticket_tags` (`ticket_id` FK, `tag_id` FK) + modelo
- [ ] **T1.10** Crear tabla `article_tags` (`article_id` FK, `tag_id` FK) + modelo
- [ ] **T1.11** Migrar datos: `kb_articles.tags` (JSON) → `article_tags` (script de migración)
- [ ] **T1.12** Eliminar columna `tags` de tabla `kb_articles` (después de migración)
- [ ] **T1.13** Tests de modelos y migraciones

## Fase 2: Backend — Endpoints

- [ ] **T2.1** Endpoint `POST /v1/ai/tickets/{id}/analyze` (ejecuta classify + summary + suggested-reply en paralelo con asyncio.gather)
- [ ] **T2.2** Agregar lógica de `kb_recommendations` en `/analyze` (buscar artículos por categoría del ticket)
- [ ] **T2.3** Agregar lógica de `pii_detected` en `/analyze` (usar `/v1/pii/redact` internamente)
- [ ] **T2.4** Endpoint `GET /v1/tickets/{id}/tags` (lista tags del ticket)
- [ ] **T2.5** Endpoint `POST /v1/tickets/{id}/tags` (agrega tag al ticket)
- [ ] **T2.6** Endpoint `DELETE /v1/tickets/{id}/tags/{tag_id}` (quita tag del ticket)
- [ ] **T2.7** Endpoint `GET /v1/customers` (lista customers del tenant)
- [ ] **T2.8** Endpoint `GET /v1/customers/{id}` (detalle de customer)
- [ ] **T2.9** Endpoint `GET /v1/tenants` (lista tenants, solo platform_admin)
- [ ] **T2.10** Endpoint `GET /v1/tenants/{id}` (detalle de tenant)
- [ ] **T2.11** Tests de todos los endpoints nuevos

## Fase 3: Frontend — Tipos y BFF

- [ ] **T3.1** Crear `src/types/customer.types.ts` (Customer)
- [ ] **T3.2** Crear `src/types/tenant.types.ts` (Tenant)
- [ ] **T3.3** Crear `src/types/tag.types.ts` (Tag, TicketTag)
- [ ] **T3.4** Actualizar `src/types/llm.types.ts` (LlmAnalyzeOutput, KbRecommendation, PiiDetection)
- [ ] **T3.5** Actualizar `src/types/ticket.types.ts` (agregar customer_id, tags)
- [ ] **T3.6** BFF: `POST /api/bff/tickets/[ticketId]/analyze` → `/v1/ai/tickets/{id}/analyze`
- [ ] **T3.7** BFF: `GET /api/bff/tickets/[ticketId]/tags` → `/v1/tickets/{id}/tags`
- [ ] **T3.8** BFF: `POST /api/bff/tickets/[ticketId]/tags` → `/v1/tickets/{id}/tags`
- [ ] **T3.9** BFF: `DELETE /api/bff/tickets/[ticketId]/tags/[tagId]` → `/v1/tickets/{id}/tags/{tag_id}`
- [ ] **T3.10** BFF: `GET /api/bff/customers/[customerId]` → `/v1/customers/{id}`
- [ ] **T3.11** BFF: `GET /api/bff/tenants/[tenantId]` → `/v1/tenants/{id}`
- [ ] **T3.12** Hook: `useTicketAnalyze(ticketId)` con TanStack Query
- [ ] **T3.13** Hook: `useTicketTags(ticketId)` con TanStack Query
- [ ] **T3.14** Hook: `useAddTicketTag(ticketId)` con mutación
- [ ] **T3.15** Hook: `useRemoveTicketTag(ticketId, tagId)` con mutación
- [ ] **T3.16** Hook: `useCustomer(customerId)` con TanStack Query
- [ ] **T3.17** Hook: `useTenant(tenantId)` con TanStack Query
- [ ] **T3.18** Tests de BFF endpoints

## Fase 4: Frontend — Layout y componentes

- [ ] **T4.1** Modificar `TicketDetailView.tsx` para layout de 3 columnas (20% / 50% / 30%)
- [ ] **T4.2** Crear componente `CustomerCard` (nombre, email, empresa, plan)
- [ ] **T4.3** Crear componente `TicketPropertiesCard` (estado, prioridad, categoría, asignado, tenant, fechas)
- [ ] **T4.4** Crear componente `TicketTagsCard` (lista de tags, botón "Agregar tag", opción de quitar)
- [ ] **T4.5** Crear componente `TicketClosedNotice` (aviso "Ticket cerrado")
- [ ] **T4.6** Modificar `MessageComposer` para bloquear en tickets cerrados
- [ ] **T4.7** Integrar todas las cards en la columna 1

## Fase 5: Frontend — Panel LLM unificado

- [ ] **T5.1** Rediseñar `LlmAssistantPanel.tsx` (eliminar tabs, vista unificada)
- [ ] **T5.2** Implementar auto-generación al cargar ticket (useEffect + useTicketAnalyze)
- [ ] **T5.3** Implementar botón "Regenerar" en header del panel
- [ ] **T5.4** Implementar botón "Regenerar" en respuesta sugerida
- [ ] **T5.5** Mostrar sección "Clasificación sugerida" (pill con categoría)
- [ ] **T5.6** Mostrar sección "Resumen" (texto)
- [ ] **T5.7** Mostrar sección "PII detectada" (pills, si hay)
- [ ] **T5.8** Mostrar sección "Riesgos" (banners, si hay)
- [ ] **T5.9** Mostrar sección "Artículos recomendados" (lista, si hay)
- [ ] **T5.10** Mostrar sección "Respuesta sugerida" (textarea editable con botones)
- [ ] **T5.11** Loading states (skeletons por sección)
- [ ] **T5.12** Error handling (mensaje + reintentar)
- [ ] **T5.13** Aviso "Las sugerencias del LLM son orientativas..."

## Fase 6: Integración y tests

- [ ] **T6.1** Tests funcionales end-to-end (layout, auto-generación, regenerar, tags)
- [ ] **T6.2** Verificar layout responsive (desktop, tablet)
- [ ] **T6.3** Verificar accesibilidad (aria-labels, focus, keyboard navigation)
- [ ] **T6.4** Verificar performance (carga inicial, regeneración)
- [ ] **T6.5** Correr `pnpm build`, `pnpm lint`, `pnpm typecheck` (0 errores, 0 warnings)
- [ ] **T6.6** Correr tests backend (`pytest`)
- [ ] **T6.7** Actualizar documentación (`arquitecture.md`, `changes.md`, `backend/api.md`, `backend/models.md`)
- [ ] **T6.8** Marcar tareas como completadas y mover feature a "Hecho" en roadmap

## Notas

- Cada tarea debe implementarse de a una y revisarse antes de continuar
- Los commits deben ser descriptivos y en inglés
- Documentar cambios en `changes.md` (frontend) y `ia_docs/cambios.md` (backend)
- Si hay dudas, preguntar antes de implementar
