# Plan de correcciones backend

Hallazgos de la suite funcional del frontend (`tests/`, 82 tests) contra el backend real en `http://localhost:8000`. Diagnóstico hecho sobre `/home/kona/backend-python`.

**Baseline:** `pytest` backend = 229 passed. Suite frontend = 82/82. Este plan **no toca código sin OK previo** (convención spec-primero, AGENTS.md).

---

## Hallazgo 1 — Orquestador LLM ticket-scoped devuelve 422 "Campos de ... inválidos"

### Diagnóstico

`MockLLMProvider.complete` (app/services/llm.py:146) devuelve **siempre** `{"ok": true, "task": "mock"}`, sin importar la tarea. `ping` e `info` funcionan porque no validan JSON estructurado; en cambio los parsers de salida estructurada fallan:

- `app/services/classifier.py:176` → `ClassificationError("Campos de clasificación inválidos")`
- `app/services/summarizer.py:159` → `SummaryError("Campos de resumen inválidos")`
- `app/services/reply_suggester.py:166` → `ReplyError("Campos de respuesta inválidos")`

Los tres se mapean a 422 en `app/api/routes_ai.py` (líneas 170, 220 y 273). Causa raíz: **el mock no es "task-aware"**. En los tests del backend esto no aparece porque se inyectan mocks custom (p. ej. `ClassifyMock` en tests/test_classify.py:15), pero en el entorno dev (`.env` sin `LLM_PROVIDER` → default `mock`) el flujo real falla.

### Fix propuesto (bajo riesgo)

Hacer el proveedor mock dependiente de la tarea:

1. `app/services/llm.py` — `BaseLLMProvider.complete` gana parámetro opcional `task: str | None = None`.
2. `HTTPLLMProvider.complete` lo acepta y lo ignora (el proveedor HTTP recibe el prompt real).
3. `MockLLMProvider.complete` hace switch por `task`:
   - `classify` → `{"category": "technical", "subcategory": "login", "intent": "incident", "suggestedPriority": "high", "confidence": 0.9, "rationale": "..." , "warnings": []}`
   - `summary` → `{"summary": "...", "missingInformation": null, "confidence": 0.9, "warnings": []}`
   - `reply` → `{"suggestedReply": "...", "confidence": 0.9, "sources": [], "policyFlags": [], "warnings": []}`
   - default (incl. `None`) → `{"ok": true, "task": "mock"}` (preserva `test_llm.py::test_mock_provider_returns_deterministic_content`).
4. `app/services/llm_orchestrator.py` — `_complete_with_retries` (línea 179) pasa `task=task` a `provider.complete(...)`.

**Compatibilidad:** los mocks de tests usan `def complete(self, **kwargs)` → no se rompen. El `classify` solo exige `category`/`intent` no vacíos y `suggestedPriority` válido (no valida contra el catálogo configurado), así que el payload de arriba pasa el parser.

**Nota de seguridad:** no incluir contenido crudo en los mensajes de error de los parsers (podría contener PII). Se mantienen los mensajes genéricos actuales.

**Tests:** unit del mock por tarea + integración del orquestador con `task=classify|summary|reply` que atraviesa los parsers. Correr `pytest`.

### ✅ Implementado y verificado (2026-08-13)

- El código ya implementaba el mock task-aware en `app/services/llm.py:141-179` con `_mock_content(task)`.
- Tests de regresión existentes:
  - `test_mock_provider_is_task_aware` (`tests/test_llm.py:43`)
  - `test_classify_success_with_default_mock` (`tests/test_classify.py:185`)
  - `test_summary_success_with_default_mock` (`tests/test_summary.py:108`)
  - `test_reply_success_with_default_mock` (`tests/test_reply.py:114`)
- Suite backend: **236 tests pasados** (sin regresión).
- Documentado en `ia_docs/cambios.md` del backend.

---

## Hallazgo 2 — KB `/v1/kb/*` no existe (404 en todo)

### Diagnóstico

El backend **no tiene módulo de KB**: no hay `routes_kb.py`, ni modelo, ni schema, ni servicio (verificado: cero matches de kb/knowledge en `app/`). La única mención está en el roadmap del backend ("Base de conocimiento por tenant (RAG avanzado)" → backlog) y en spec.md §14.3. En cambio el frontend **Feature 007 ya está implementado** y consume el contrato a través del BFF: 8 rutas que hoy caen al 404 de FastAPI.

### Alcance propuesto

Crear la feature **`019-base-conocimiento`** en `/home/kona/backend-python/ia_docs/features/` (spec.md → plan.md → tasks.md → **OK del usuario** → implementar de a una tarea). Contrato alineado al BFF (`src/app/api/bff/knowledge/...`) y a la spec frontend `007-base-de-conocimiento/spec.md` §"Contratos KB":

| Método | Ruta | Permiso | Notas |
| --- | --- | --- | --- |
| GET | `/v1/kb/articles` | `kb:read` | Lista sin `body`; query `status/category/tag/search/limit/offset` |
| POST | `/v1/kb/articles` | `kb:edit` | Crea en `draft` |
| GET | `/v1/kb/articles/{id}` | `kb:read` | Detalle con `body` |
| PATCH | `/v1/kb/articles/{id}` | `kb:edit` | Genera snapshot de versión |
| POST | `/v1/kb/articles/{id}/publish` | `kb:publish` | `draft → published` |
| POST | `/v1/kb/articles/{id}/archive` | `kb:edit` | `published → archived` |
| POST | `/v1/kb/articles/{id}/restore` | `kb:edit` | `archived → draft` |
| GET | `/v1/kb/articles/{id}/versions` | `kb:read` | Historial read-only |

Piezas a implementar (siguiendo patrones existentes: `TicketRepository`/`TenantScopedRepository`, rutas con 403 sin tenant y 404 cross-tenant, errores `{"detail": ...}`, auditoría `kb.*`):

1. **Permisos** (`app/core/permissions.py`): agregar `kb:read`, `kb:edit`, `kb:publish` a `ROLE_PERMISSIONS`, alineados con el frontend (`src/lib/permissions.ts`): todos los roles leen; `supervisor`+ editan y publican; `agent` solo lee.
2. **Modelos** (`app/models/kb.py` + registro en `app/models/__init__.py`): `KbArticle` (id, tenant_id, title, body, category, status, author_id, current_version, created_at, updated_at, published_at) y `KbArticleVersion` (snapshot por versión). `Base.metadata.create_all` en startup crea las tablas automáticamente.
3. **Schemas** (`app/schemas/kb.py`): `KbArticleOut`, `KbArticleSummaryOut` (sin body), `KbArticleListOut`, `KbArticleVersionOut`, inputs de create/update. Nombres de campo camelCase igual que en `src/types/knowledge.types.ts`.
4. **Servicio/repositorio** (`app/repositories/kb.py` + `app/services/kb.py`): filtro tenant obligatorio; versión +1 en cada PATCH (nuevo snapshot); transiciones de estado validas.
5. **Rutas** (`app/api/routes_kb.py`) + registro en `app/main.py`.
6. **Tests** (`tests/test_kb.py`) y actualizar `tests/knowledge.test.ts` del frontend (hoy espera 404).

### Decisiones a confirmar antes de implementar

1. **Cifrado de title/body**: se propone **texto plano** (contenido operativo interno, búsqueda SQL por `LIKE`, y el grounding LLM redacta PII al construir contexto). Si se cifra como tickets, la búsqueda `LIKE` deja de funcionar → limitación de diseño a documentar.
2. **Filtro por `tag`**: los tags son `string[]`. Para portabilidad SQLite/Postgres se propone tabla normalizada `kb_article_tags` (id, article_id, tag) en vez de JSON + funciones de dialecto.
3. **Versiones**: `create` → versión 1; cada `PATCH` → snapshot con `current_version+1`. `publish`/`archive`/`restore` solo cambian estado sin generar versión (confirmar).
4. **Transiciones**: validar explícitamente cada transición (p. ej. archive solo desde published; publish solo desde draft; restore solo desde archived) con 422 si es inválida.
5. **Búsqueda `search`**: `LIKE` case-insensitive sobre title y body (`func.lower()`).

### ✅ Implementado y verificado (2026-08-13)

- Feature 019 creada en `/home/kona/backend-python/ia_docs/features/019-base-conocimiento/` con spec.md, plan.md y tasks.md.
- Implementación completa:
  - Permisos `kb:read`, `kb:edit`, `kb:publish` en `app/core/permissions.py`.
  - Modelos `KbArticle`, `KbArticleVersion`, `KbArticleTag` en `app/models/kb.py`.
  - Schemas en `app/schemas/kb.py`.
  - Repositorio `KbRepository` en `app/repositories/kb.py` con list (filtros), create, update (versionado), publish/archive/restore (transiciones validadas), list_versions.
  - 8 endpoints en `app/api/routes_kb.py` con isolación por tenant y auditoría.
- Tests: 23 tests en `tests/test_kb.py` (CRUD, permisos, isolación, versionado, transiciones, búsqueda, filtro por tag, auditoría).
- Frontend: `tests/knowledge.test.ts` actualizado con 11 tests para validar flujo completo.
- Suite backend: **259 tests pasados**.
- Suite frontend: **106 tests pasados**.
- Decisiones confirmadas: sin cifrado, tabla normalizada para tags, versionado por snapshot, transiciones validadas, búsqueda LIKE.
- Documentado en `ia_docs/cambios.md` del backend.

---

## Hallazgo 3 — RBAC: falta validar rutas tenant-scoped con un `tenant_admin` real

### Diagnóstico

El admin de `.env` es `platform_admin` **sin tenant** → las rutas tenant-scoped responden 403 "Rol sin tenant asignado" (`_require_tenant` en app/services/admin.py:63; list_tenant_users en routes_admin.py:35; list_audit_events en routes_audit.py:32). Ese 403 es **correcto** para un usuario sin tenant. Lo que falta es validar el flujo completo con un `tenant_admin` con tenant asignado (admin list, audit, tenant ai-policy), porque no había credenciales.

Revisado el código, no se ve bug evidente: `tenant_admin` tiene `CONFIGURE_TENANT` y `VIEW_AUDIT`, y el service resuelve su tenant. La tarea es **validar y asegurar con tests**, no asumir un fix.

### Plan

1. **Seed de tenant_admin en la suite funcional**: login con `platform_admin` (.env) → `POST /admin/users` `{role: "tenant_admin", tenant_id: "test-tenant"}` (ya funciona, 201; admin.service `_resolve_target_tenant` permite platform→cualquier tenant) → login como ese usuario.
2. **Suite frontend** (nuevo `tests/admin-tenant.test.ts`): validar con tenant_admin → `GET /admin/users` 200 (solo su tenant), `PATCH /admin/users/{id}` 200 (rol/activación), `GET/PUT /admin/ai-policy` 200 round-trip idempotente, `GET /audit/events` 200, `GET /v1/ai/info` 200 (VIEW_AUDIT).
3. **pytest backend**: ampliar `tests/test_admin.py`/`test_audit.py` con casos tenant_admin: listar usuarios de su tenant, 403 al editar usuario de otro tenant, 403 al crear en otro tenant, GET/PUT ai-policy propio. Corregir solo si aparece un bug real.
4. **Decisión de producto a confirmar**: ¿el `platform_admin` sin tenant debería poder operar a nivel plataforma sobre cualquier tenant (listar usuarios, leer políticas)? Hoy 403 en tenant-scoped. Opciones: (a) mantener 403 y documentar (recomendado, ya validado por el frontend), o (b) permitir `?tenant_id=` explícito solo a platform_admin. Proponer (a).

### ✅ Implementado y verificado (2026-08-13)

- Se agregó `seedTenantAdmin()` en `tests/support/client.ts` para crear usuarios `tenant_admin` directamente contra FastAPI.
- Tests agregados en el frontend:
  - `tests/admin.test.ts`: 6 tests nuevos para `tenant_admin` (listar, crear, editar usuarios del propio tenant; 403 al crear en otro tenant o crear platform_admin; 404 al editar usuario de otro tenant).
  - `tests/audit.test.ts`: 2 tests nuevos para `tenant_admin` (leer eventos del propio tenant, filtrar por action).
  - `tests/ai-policy.test.ts`: 3 tests nuevos para `tenant_admin` (ai-info → 200, GET policy → 200, PUT round-trip idempotente, PUT modifica ai_enabled).
- Los tests usan tenants diferentes para evitar interferencias entre suites.
- Suite frontend: **95 tests pasados** (sin regresión).
- No se encontraron bugs en el backend; el RBAC funciona correctamente.
- Decisión de producto: se mantiene el 403 para `platform_admin` sin tenant en rutas tenant-scoped (opción a).
- Documentado en `ia_docs/cambios.md` del backend.

---

## Hallazgo 4 — `total` del listado de tickets se desfasa de `items` bajo concurrencia

### Diagnóstico

`TicketRepository.list` (app/repositories/tickets.py:166) ejecuta `count` y `select` en **dos statements separados** → bajo escrituras concurrentes cada statement ve una snapshot distinta (observado 17 vs 18). Afecta a `GET /v1/tickets` y `GET /v1/workspace/my-tickets` (mismo repo). Ocurre tanto en SQLite (dev) como en Postgres READ COMMITTED (prod).

### Fix propuesto (bajo riesgo)

Query única con window function `COUNT(*) OVER ()` para obtener `total` de la **misma snapshot** que los `items`, con fallback:

- En `repositories/tickets.py:list`: agregar `func.count().over()` al `select` (sin el `count` separado). Si `items` queda vacío (offset más allá del total), correr el `count` por separado para devolver el `total` real.

**Tests:** mantener los existentes; agregar caso de `offset` mayor al total (valida el fallback) y aserción de consistencia `total >= len(items)` en el caso normal. No testear el race puro (flaky): cubrir con humo.

### ✅ Implementado y verificado (2026-08-13)

- El código ya usaba window function `func.count().over().label("_total")` en `app/repositories/tickets.py:167` con fallback en líneas 176-177.
- Tests agregados: `test_list_tickets_offset_beyond_total_returns_correct_count` y `test_list_tickets_total_consistency`.
- Suite backend: **236 tests pasados** (sin regresión).
- Documentado en `ia_docs/cambios.md` del backend.

---

## Hallazgo 5 — correlationId cliente→BFF no se reenvía a FastAPI

### Diagnóstico

- Cliente → BFF: `bffClient` envía `x-correlation-id` (src/lib/api/bffClient.ts:40) y lo guarda en `ApiError.correlationId` (errors.ts).
- BFF → FastAPI: `authenticatedFetch` (src/lib/api/authenticated.ts:41) → `fastApiFetch` (src/lib/api/fastapi.ts) **no reenvía ningún correlation id**.
- Backend: ya acepta `X-Request-ID` entrante y lo usa como trace (app/core/observability.py:48, propagado a auditoría/logging vía `set_trace_id`), y lo devuelve en el header `X-Request-ID` de la respuesta.

El backend está listo; falta la cadena en el **frontend**.

### Fix propuesto (2 partes)

1. **`src/lib/api/fastapi.ts`**: aceptar un correlation id en options; enviarlo como header `X-Request-ID` en el fetch; al fallar, leer `res.headers.get("x-request-id")` de la respuesta de FastAPI y usarlo como `correlationId` del `ApiError` (cuando venga).
2. **`src/lib/api/authenticated.ts`**: leer `req?.headers.get("x-correlation-id")` del request del cliente y pasarlo a `fastApiFetch` (en la llamada inicial y el retry). Como el backend ya lo devuelve en su header `X-Request-ID`, el `ApiError` queda con el trace real del backend.

**Tests funcionales:** el BFF no expone hoy `X-Request-ID` al cliente; para poder verificarlo, `apiErrorResponse` (authenticated.ts:75) debería incluir el `correlationId` (del backend) en el JSON de error (p. ej. campo `correlation_id`) cuando esté disponible. El test envía un `x-correlation-id` custom a una ruta que falla (p. ej. KB inexistente o feedback con sugerencia inválida) y asertar que el error del BFF lleve ese trace.

### ✅ Implementado y verificado (2026-08-13)

- El código ya implementaba la cadena de correlation id en `fastapi.ts` y `authenticated.ts`.
- Se corrigieron 12 Route Handlers GET que no pasaban el `req` a `authenticatedFetch`, impidiendo que el `correlationId` se reenviara al backend.
- Tests actualizados:
  - `tests/hardening.test.ts`: nuevo test `correlation-id: el error del BFF incluye el trace del backend`.
  - `tests/llm.test.ts`: actualizado para reflejar que el mock task-aware funciona (200 en lugar de 422).
- Suite frontend: **83 tests pasados** (sin regresión).
- Documentado en `ia_docs/cambios.md` del backend.

---

## Orden de ejecución propuesto

1. **Hallazgo 4** (window function) — pequeño, aislado, desbloquea consistencia de datos.
2. **Hallazgo 1** (mock LLM task-aware) — pequeño, desbloquea classify/summary/reply en dev y en el suite.
3. **Hallazgo 5** (correlation id) — frontend+backend, pequeño.
4. **Hallazgo 3** (validación tenant_admin) — tests + seed; fix solo si aparece bug.
5. **Hallazgo 2** (KB) — feature grande, spec-primero con OK del usuario.

Cada uno: implementar → correr su suite → mostrar al usuario antes de seguir.

## Verificación

- Backend: `.venv/bin/python -m pytest -q`, `.venv/bin/python -m compileall -q app tests scripts`, `bash scripts/check_secrets.sh`.
- Frontend: `pnpm test:functional` (82 → más con nuevos tests), `pnpm typecheck`, `pnpm lint` (0 warnings).
- Documentar en `ia_docs/cambios.md` (backend) e `ia-docs/init/changes.md` (frontend); actualizar roadmaps.

## Archivos clave referenciados

- Backend: `app/services/llm.py` (:146 mock), `app/services/llm_orchestrator.py` (:179), `app/services/{classifier,summarizer,reply_suggester}.py`, `app/repositories/tickets.py` (:166), `app/core/observability.py` (:48), `app/core/permissions.py`, `app/services/admin.py`, `app/api/{routes_ai,routes_tickets,routes_admin,routes_audit,routes_workspace}.py`, `app/main.py`.
- Frontend: `src/lib/api/{bffClient,authenticated,fastapi,errors}.ts`, `src/types/knowledge.types.ts`, `src/app/api/bff/knowledge/**`, `tests/*`.
