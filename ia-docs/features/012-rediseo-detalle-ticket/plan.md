# Plan — Feature 012 Rediseño del detalle de ticket

## Orden de implementación

### Fase 1: Backend — Modelos de datos (020-backend-modelos)

1. Crear tabla `tenants` y seed
2. Crear tabla `customers` y seed
3. Crear tabla `user_tenants` y migrar `users.tenant_id`
4. Agregar FK `customer_id` en `tickets`
5. Crear tablas `ticket_tags` y `article_tags`
6. Migrar `kb_articles.tags` (JSON) a `article_tags`
7. Tests de modelos y migraciones

### Fase 2: Backend — Endpoints (020-backend-endpoints)

1. Endpoint `POST /v1/ai/tickets/{id}/analyze` (parallel LLM calls)
2. Endpoints de tags (`GET/POST/DELETE /v1/tickets/{id}/tags`)
3. Endpoints de customers (`GET /v1/customers`, `GET /v1/customers/{id}`)
4. Endpoints de tenants (`GET /v1/tenants`, `GET /v1/tenants/{id}`)
5. Tests de endpoints

### Fase 3: Frontend — Tipos y BFF (012-frontend-tipos-bff)

1. Tipos: `customer.types.ts`, `tenant.types.ts`, `tag.types.ts`, actualizar `llm.types.ts`
2. BFF endpoints: analyze, tags, customers, tenants
3. Hooks TanStack Query: `useTicketAnalyze`, `useTicketTags`, `useCustomer`, `useTenant`
4. Tests de BFF

### Fase 4: Frontend — Layout y componentes (012-frontend-ui)

1. Layout de 3 columnas en `TicketDetailView`
2. Componente `CustomerCard`
3. Componente `TicketPropertiesCard`
4. Componente `TicketTagsCard` (con agregar/quitar)
5. Componente `TicketClosedNotice`
6. Bloquear composer en tickets cerrados

### Fase 5: Frontend — Panel LLM unificado (012-frontend-llm)

1. Rediseñar `LlmAssistantPanel` (sin tabs, vista unificada)
2. Auto-generar al cargar ticket
3. Botón "Regenerar" en header
4. Botón "Regenerar" en respuesta sugerida
5. Mostrar PII detectada, riesgos, KB recommendations
6. Loading states y error handling

### Fase 6: Integración y tests (012-integracion)

1. Tests funcionales end-to-end
2. Verificar layout responsive
3. Verificar accesibilidad
4. Verificar performance
5. Documentar cambios

## Criterios de aceptación

- [ ] Layout de 3 columnas (20% / 50% / 30%)
- [ ] Columna 1: Card cliente + Card ticket + Card tags
- [ ] Columna 2: Chat + composer (bloqueado si cerrado)
- [ ] Columna 3: Panel LLM unificado con auto-generación
- [ ] Botón "Regenerar" en header del panel LLM
- [ ] Botón "Regenerar" en respuesta sugerida
- [ ] Tags se pueden agregar/quitar
- [ ] Multi-tenant: usuarios pueden pertenecer a múltiples tenants
- [ ] Tests backend pasan
- [ ] Tests frontend pasan
- [ ] Lint 0 warnings
- [ ] Typecheck 0 errores

## Dependencias entre tareas

- Fase 2 depende de Fase 1 (modelos)
- Fase 3 depende de Fase 2 (endpoints)
- Fase 4 y 5 dependen de Fase 3 (tipos y hooks)
- Fase 6 depende de todas las anteriores

## Estimación

- Fase 1: 2-3 horas
- Fase 2: 2-3 horas
- Fase 3: 1-2 horas
- Fase 4: 2-3 horas
- Fase 5: 2-3 horas
- Fase 6: 1-2 horas

Total: ~12-16 horas
