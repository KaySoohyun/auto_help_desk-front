# 007 · Base de conocimiento

**Estado:** propuesta.
**Alcance:** Fase 3 del plan (Etapas 3.1–3.4).
**Bloqueo conocido:** el backend FastAPI **no expone endpoints de KB** (`ia-docs/backend/api.md` no los lista). Esta feature define los contratos BFF + FastAPI y los documenta en `backend/api.md` como **pendientes de implementación en FastAPI**. El frontend se implementa contra esos contratos; la validación funcional queda pendiente hasta que el backend exista (mismo patrón que 005/006).

## Qué hace

Base de conocimiento operativa dentro del tenant: los agentes **leen** artículos publicados y los usan desde tickets; supervisores y admins **gestionan** artículos (crear, editar, publicar, archivar) con draft/published/archived, categorías, tags y versionado básico. El panel LLM puede sugerir artículos relacionados e insertar una referencia en la respuesta.

## Por qué

La misión exige "base de conocimiento — artículos con draft/published/archived, categorías, versionado y uso desde tickets y LLM". Hoy el producto resuelve tickets con LLM pero no reutiliza el conocimiento acumulado: cada agente responde desde cero. La KB reduce tiempo de resolución, uniforma respuestas y da al LLM fuentes citables (Fase 3 del plan).

## Contexto real del backend

- `ia-docs/backend/api.md` **no tiene** endpoints de KB; `ia-docs/backend/models.md` **no tiene** tabla de artículos. El spec solo los menciona como "aproximados" (`GET/POST /knowledge/articles`).
- Patrón existente a seguir: endpoints por tenant que devuelven 403 si el usuario no tiene tenant y 404 si el recurso es inexistente o de otro tenant; errores `{ "detail": "..." }`; permisos validados por rol.
- **Decisión (aprobada):** esta feature define los contratos KB en el BFF y los documenta en `backend/api.md` como pendientes de FastAPI. No se inventan datos; el BFF proxya a `/v1/kb/...` con los contratos que se definen abajo.

## Contratos KB (definidos aquí, pendientes en FastAPI)

Base `/v1/kb`, requieren tenant.

| Método | Ruta | Permiso | Descripción |
| --- | --- | --- | --- |
| GET | `/v1/kb/articles` | `kb:read` | Lista (sin `body`). Query: `status`, `category`, `tag`, `search`, `limit`, `offset` |
| POST | `/v1/kb/articles` | `kb:edit` | Crea artículo en `draft` |
| GET | `/v1/kb/articles/{id}` | `kb:read` | Detalle con `body` |
| PATCH | `/v1/kb/articles/{id}` | `kb:edit` | Actualiza título/cuerpo/categoría/tags; genera snapshot de versión |
| POST | `/v1/kb/articles/{id}/publish` | `kb:publish` | `draft → published` |
| POST | `/v1/kb/articles/{id}/archive` | `kb:edit` | `published → archived` |
| POST | `/v1/kb/articles/{id}/restore` | `kb:edit` | `archived → draft` |
| GET | `/v1/kb/articles/{id}/versions` | `kb:read` | Historial de versiones |

**Schemas:**
- `KbArticleOut`: `{ id, tenant_id, title, body, category, tags: string[], status: draft|published|archived, author_id, current_version, created_at, updated_at, published_at }`
- `KbArticleSummaryOut` (ítem de listas): igual **sin** `body`.
- `KbArticleListOut`: `{ items: [KbArticleSummaryOut], total, limit, offset }`
- `KbArticleVersionOut`: `{ id, article_id, version, title, body, category, tags, author_id, change_note, created_at }`

> Documentar estos contratos en `ia-docs/backend/api.md` y `models.md` como pendientes (T7).

## Decisiones de diseño

1. **Rutas reales `/app/*`** (no `/tenant/[tenantSlug]/...`, que está en el spec "aproximado" pero no implementado): `/app/knowledge` → listado, `/app/knowledge/articles/[articleId]`, `/app/knowledge/articles/new`, `/app/knowledge/categories`.
2. **Categorías y tags como strings planos** sobre el artículo (mismo patrón que `Ticket.category` ≤100 chars). No hay CRUD de categorías/tags en esta feature: el taxonomy view agrupa lo existente; la gestión de catálogo vive en Administración (007 admin, Etapa 4.2). Así no solapamos alcance.
3. **Versionado por snapshot**: cada PATCH guarda una `KbArticleVersion` (título/cuerpo/categoría/tags). El historial es **solo lectura** en MVP; sin rollback (decisión abierta #34 del plan).
4. **Sin nuevas dependencias**: el editor es `textarea` (texto plano, `whitespace-pre-wrap` al renderizar) — sin `dangerouslySetInnerHTML` ni librería markdown. Si más adelante se quiere markdown/rich text, es una decisión separada que requiere avisar por dependencia.
5. **Permisos UI** en `src/lib/permissions.ts`: `kb:read` (todos los roles con tenant), `kb:edit` (supervisor+, para crear/editar/archivar/restaurar borradores) y `kb:publish` (supervisor+, para publicar). Agente = solo lectura de publicados. La UI oculta acciones; el backend decide.
6. **Publicación supervisada mínima**: solo `kb:publish` puede pasar a `published`. No hay workflow formal de revisión/aprobación (fuera de alcance).
7. **Integración con tickets/LLM (3.4)**: el panel LLM (`LlmAssistantPanel`) suma una sección "Artículos relacionados" (búsqueda de artículos publicados por categoría/etiquetas del ticket) y un botón "Insertar referencia" que agrega una línea citable en el composer vía el mismo mecanismo `onUseReply`. Nunca envía automáticamente.
8. **Métricas de uso**: no se construyen en MVP (requieren backend de tracking). El contrato deja `published_at`/`current_version` para futuras métricas.
9. **Filtros en URL** (estado, categoría, búsqueda) parseados con Zod; búsqueda client-side con debounce (patrón de la bandeja 002).

## Criterios de aceptación

- [ ] `/app/knowledge` muestra el listado con filtros por estado/categoría/búsqueda en URL, paginación y estados loading/error/empty.
- [ ] El agente ve y lee solo artículos `published` (acciones de gestión ocultas; el backend decide).
- [ ] Supervisor/admin puede crear borradores, editar, publicar y archivar con confirmación de acciones destructivas.
- [ ] El editor soporta título, cuerpo, categoría y tags; todo cambio guarda una versión.
- [ ] El historial de versiones se muestra en el detalle (solo lectura).
- [ ] El panel LLM muestra artículos relacionados y permite insertar una referencia en el composer (sin envío automático).
- [ ] Contratos KB documentados en `ia-docs/backend/api.md` y `models.md` como pendientes de FastAPI.
- [ ] `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde (0 errores, 0 warnings).
- [ ] Sin `dangerouslySetInnerHTML`; contenido de artículos renderizado como texto.
- [ ] a11y: contraste AA, labels, focus-visible, confirmaciones con foco gestionado.

## Fuera de alcance

- CRUD de catálogo de categorías/tags (va en Administración 007, Etapa 4.2).
- Rollback de versiones y diffs visuales (decisión abierta del plan).
- Portal público de conocimiento (misión: no es un portal/CMS abierto).
- Búsqueda semántica / full-text avanzado (depende del backend).
- Workflow de revisión/aprobación de artículos.
- Métricas de uso por artículo/agente.
- Markdown / rich text en el editor.

## Datos de prueba

- Sin backend KB todavía: la validación funcional contra FastAPI real queda pendiente (se registra en `tasks.md` T7). Los contratos BFF se pueden verificar con respuestas simuladas durante el desarrollo.
- Cuando exista backend: usuario agente lee publicados; supervisor crea/publica/archiva; versión incrementa en cada edición; referencia insertada en composer.
