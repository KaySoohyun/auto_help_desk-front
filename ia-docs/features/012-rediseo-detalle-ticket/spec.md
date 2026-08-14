# Feature 012 — Rediseño del detalle de ticket

## Contexto

El detalle de ticket actual tiene un layout de 2 columnas (contenido + panel LLM). Se requiere rediseñar a 3 columnas para mejor organización visual y operativa:

1. **Columna izquierda (20%)**: Datos del cliente + propiedades del ticket + tags
2. **Columna central (50%)**: Conversación (chat)
3. **Columna derecha (30%)**: Asistente LLM unificado

Además, se requiere:
- Bloquear el composer en tickets cerrados
- Auto-generar análisis LLM al entrar al ticket
- Unificar el panel LLM (sin tabs, todo en una vista)
- Botón "Regenerar" en header del panel LLM y en respuesta sugerida
- Crear modelos de datos faltantes (customers, tenants, tags relacionales)
- Nuevo endpoint LLM que devuelva todo junto

## Objetivos

1. Layout de 3 columnas con proporciones 20% / 50% / 30%
2. Primera columna con 3 cards: cliente, propiedades del ticket, tags
3. Segunda columna con conversación y composer (bloqueado si ticket cerrado)
4. Tercera columna con panel LLM unificado (clasificación, resumen, respuesta sugerida, PII, riesgos, KB recommendations)
5. Auto-generar análisis LLM al cargar el ticket
6. Botón "Regenerar" en header del panel LLM
7. Botón "Regenerar" individual en respuesta sugerida
8. Eliminar tabs del panel LLM (Sugerencias y Streaming)
9. Soporte para multi-tenant real (usuarios en múltiples tenants)
10. Modelo de datos completo: customers, tenants, tags relacionales

## Alcance

### Backend (FastAPI)

#### Nuevos modelos

1. **Tabla `tenants`**: `id`, `name`, `slug`, `created_at`
2. **Tabla `customers`**: `id`, `tenant_id` (FK), `name`, `email`, `company`, `plan`, `created_at`
3. **Tabla `user_tenants`**: `user_id` (FK), `tenant_id` (FK), `role`, `created_at` (reemplaza `users.tenant_id`)
4. **Tabla `ticket_tags`**: `ticket_id` (FK), `tag_id` (FK)
5. **Tabla `article_tags`**: `article_id` (FK), `tag_id` (FK) (reemplaza `kb_articles.tags` JSON)
6. **FK `customer_id`** en tabla `tickets` (nullable)

#### Cambios en modelos existentes

- `users`: eliminar `tenant_id`, migrar a `user_tenants`
- `kb_articles`: eliminar campo `tags` (JSON), usar `article_tags`
- `tickets`: agregar `customer_id` (FK nullable)

#### Nuevo endpoint LLM

**`POST /v1/ai/tickets/{id}/analyze`**

Ejecuta en paralelo (asyncio.gather):
- `/v1/ai/tickets/{id}/classify`
- `/v1/ai/tickets/{id}/summary`
- `/v1/ai/tickets/{id}/suggested-reply`

Respuesta:
```json
{
  "classification": {
    "category": "billing",
    "subcategory": "tarjeta",
    "intent": "incident",
    "suggested_priority": "high",
    "confidence": 0.92,
    "rationale": "...",
    "warnings": [],
    "suggestion_id": 12,
    "trace_id": "uuid"
  },
  "summary": {
    "summary": "...",
    "missing_information": "...",
    "confidence": 0.9,
    "warnings": [],
    "suggestion_id": 13,
    "trace_id": "uuid"
  },
  "suggested_reply": {
    "suggested_reply": "...",
    "confidence": 0.88,
    "sources": [],
    "policy_flags": [],
    "warnings": [],
    "suggestion_id": 14,
    "trace_id": "uuid"
  },
  "kb_recommendations": [
    { "article_id": 5, "title": "Cómo pagar con tarjeta", "score": 0.95 }
  ],
  "pii_detected": [
    { "type": "email", "value": "[EMAIL]", "position": 45 }
  ],
  "risks": []
}
```

#### Endpoints de tags

**`GET /v1/tickets/{id}/tags`** — Lista tags del ticket
**`POST /v1/tickets/{id}/tags`** — Agrega tag al ticket
**`DELETE /v1/tickets/{id}/tags/{tag_id}`** — Quita tag del ticket

#### Endpoints de customers

**`GET /v1/customers`** — Lista customers del tenant
**`GET /v1/customers/{id}`** — Detalle de customer
**`POST /v1/customers`** — Crea customer
**`PATCH /v1/customers/{id}`** — Actualiza customer

#### Endpoints de tenants

**`GET /v1/tenants`** — Lista tenants (solo platform_admin)
**`GET /v1/tenants/{id}`** — Detalle de tenant

#### Seed

- Crear tabla `tenants` con datos de prueba
- Crear customers de prueba asociados a tenants
- Migrar `users.tenant_id` a `user_tenants`

### Frontend (Next.js)

#### Layout de 3 columnas

**Archivo**: `src/components/features/tickets/TicketDetailView.tsx`

```tsx
<div className="grid grid-cols-[20%_50%_30%] gap-6">
  {/* Columna 1: Metadata */}
  <div className="space-y-4">
    <CustomerCard customer={customer} />
    <TicketPropertiesCard ticket={ticket} tenant={tenant} />
    <TicketTagsCard ticketId={ticket.id} tags={tags} />
  </div>

  {/* Columna 2: Conversación */}
  <div className="space-y-4">
    <TicketThread ticketId={ticket.id} />
    <MessageComposer disabled={ticket.status === "closed"} />
    {ticket.status === "closed" && <TicketClosedNotice />}
  </div>

  {/* Columna 3: Asistente LLM */}
  <LlmAssistantPanel ticketId={ticket.id} />
</div>
```

#### Nuevos componentes

1. **`CustomerCard`**: nombre, email, empresa, plan
2. **`TicketPropertiesCard`**: estado, prioridad, categoría, asignado, tenant, fechas
3. **`TicketTagsCard`**: lista de tags con botón "Agregar tag" y opción de quitar
4. **`TicketClosedNotice`**: aviso "Ticket cerrado — no se pueden enviar mensajes"
5. **`LlmAssistantPanel`** (rediseñado): unificado, sin tabs

#### Panel LLM unificado

**Archivo**: `src/components/features/llm/LlmAssistantPanel.tsx`

Estructura:
```
┌─────────────────────────────────────┐
│ 🤖 Asistente LLM    [Regenerar]   │
├─────────────────────────────────────┤
│ ⚠️ Aviso: revisar antes de enviar │
├─────────────────────────────────────┤
│ Clasificación sugerida              │
│ [pill: billing]                     │
├─────────────────────────────────────┤
│ Resumen                             │
│ Texto del resumen...                │
├─────────────────────────────────────┤
│ PII detectada (si hay)              │
│ [pill: email] [pill: phone]         │
├─────────────────────────────────────┤
│ Riesgos (si hay)                    │
│ ⚠️ Mensaje de riesgo                │
├─────────────────────────────────────┤
│ Artículos recomendados              │
│ • Cómo pagar con tarjeta            │
│ • Error 4012 en pagos               │
├─────────────────────────────────────┤
│ RESPUESTA SUGERIDA    [Editar]      │
│ ┌─────────────────────────────────┐ │
│ │ Texto de la respuesta...        │ │
│ └─────────────────────────────────┘ │
│                        [Regenerar]  │
└─────────────────────────────────────┘
```

#### Auto-generación LLM

Al cargar el ticket, ejecutar automáticamente `POST /v1/ai/tickets/{id}/analyze` y mostrar resultados.

#### Hooks nuevos

1. **`useTicketAnalyze(ticketId)`**: llama al endpoint `/analyze`
2. **`useTicketTags(ticketId)`**: lista tags del ticket
3. **`useAddTicketTag(ticketId)`**: agrega tag
4. **`useRemoveTicketTag(ticketId, tagId)`**: quita tag
5. **`useCustomer(customerId)`**: datos del customer
6. **`useTenant(tenantId)`**: datos del tenant

#### BFF endpoints nuevos

1. **`POST /api/bff/tickets/[ticketId]/analyze`** → `/v1/ai/tickets/{id}/analyze`
2. **`GET /api/bff/tickets/[ticketId]/tags`** → `/v1/tickets/{id}/tags`
3. **`POST /api/bff/tickets/[ticketId]/tags`** → `/v1/tickets/{id}/tags`
4. **`DELETE /api/bff/tickets/[ticketId]/tags/[tagId]`** → `/v1/tickets/{id}/tags/{tag_id}`
5. **`GET /api/bff/customers/[customerId]`** → `/v1/customers/{id}`
6. **`GET /api/bff/tenants/[tenantId]`** → `/v1/tenants/{id}`

#### Tipos nuevos

**`src/types/customer.types.ts`**:
```typescript
export interface Customer {
  id: number;
  tenant_id: string;
  name: string;
  email: string;
  company: string | null;
  plan: string | null;
  created_at: string;
}
```

**`src/types/tenant.types.ts`**:
```typescript
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}
```

**`src/types/tag.types.ts`**:
```typescript
export interface Tag {
  id: number;
  tenant_id: string;
  name: string;
  created_at: string;
}

export interface TicketTag {
  ticket_id: number;
  tag_id: number;
  tag: Tag;
}
```

**`src/types/llm.types.ts`** (agregar):
```typescript
export interface LlmAnalyzeOutput {
  classification: ClassificationOutput;
  summary: SummaryOutput;
  suggested_reply: SuggestedReplyOutput;
  kb_recommendations: KbRecommendation[];
  pii_detected: PiiDetection[];
  risks: LlmRisk[];
}

export interface KbRecommendation {
  article_id: number;
  title: string;
  score: number;
}

export interface PiiDetection {
  type: string;
  value: string;
  position: number;
}
```

## Fuera de alcance

- Portal público de clientes
- Búsqueda semántica avanzada en KB
- Rollback de versiones en KB
- Multi-idioma en UI
- Modo claro
- Notificaciones en tiempo real
- Bulk actions avanzadas

## Dependencias

- Backend FastAPI debe implementar los nuevos modelos y endpoints
- Migración de datos: `users.tenant_id` → `user_tenants`
- Seed de tenants y customers de prueba

## Riesgos

- Migración de `users.tenant_id` puede romper código existente
- Performance del endpoint `/analyze` si los calls al LLM son lentos
- Cambios en el modelo de tags pueden afectar KB articles existentes

## Métricas de éxito

- Layout de 3 columnas renderiza correctamente
- Panel LLM se auto-genera al cargar ticket
- Botón "Regenerar" funciona en header y en respuesta sugerida
- Tags se pueden agregar/quitar del ticket
- Datos del cliente y tenant se muestran correctamente
- Composer bloqueado en tickets cerrados
- Tests pasan (backend + frontend)
