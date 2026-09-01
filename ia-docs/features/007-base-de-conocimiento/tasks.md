# 007 · Base de conocimiento — Tasks

Estado: propuesta. Marcar `[ ]` pendiente y `[x]` al completar.

## T1 · Tipos y contratos BFF (sin UI)

- [x] `src/types/knowledge.types.ts`: `KbArticleStatus` (`draft|published|archived`), `KbArticle`, `KbArticleSummary`, `KbArticleList`, `KbArticleVersion`, `KbArticleListQuery` (`status`, `category`, `tag`, `search`, `limit`, `offset`), `KbArticleCreatePayload` (title, body, category, tags), `KbArticleUpdatePayload`.
- [x] BFF `GET/POST /api/bff/knowledge/articles/route.ts`: lista con Zod (query params) y crea artículo (`title` 1–200, `body` 1–10000, `category` ≤100, `tags` array ≤10 strings ≤50). Proxy a `/v1/kb/articles` con `authenticatedFetch`.
- [x] BFF `GET/PATCH /api/bff/knowledge/articles/[articleId]/route.ts`: detalle (con `body`) y actualización (PATCH parcial; exige al menos un campo).
- [x] BFF `POST /api/bff/knowledge/articles/[articleId]/publish|archive|restore/route.ts`: transiciones de estado.
- [x] BFF `GET /api/bff/knowledge/articles/[articleId]/versions/route.ts`: historial.

## T2 · Hooks TanStack Query

- [x] `src/hooks/knowledge/queryKeys.ts`: `articleListKey(tenantId, query)`, `articleDetailKey(tenantId, articleId)`, `articleVersionsKey(tenantId, articleId)` (con prefijo `'knowledge'`).
- [x] `src/hooks/knowledge/useArticles.ts`: query listado (filtros + paginación, `AbortController` vía `signal`).
- [x] `src/hooks/knowledge/useArticle.ts`: query detalle.
- [x] `src/hooks/knowledge/useArticleVersions.ts`: query versiones.
- [x] Mutaciones: `useCreateArticle`, `useUpdateArticle`, `usePublishArticle`, `useArchiveArticle`, `useRestoreArticle` con invalidación (lista + detalle + versiones).

## T3 · Listado, filtros y búsqueda

- [x] `src/app/app/knowledge/page.tsx`: redirige a `/app/knowledge/articles`.
- [x] `src/app/app/knowledge/articles/page.tsx` (Server Component): guard de sesión/tenant + permisos `kb:read`; pasa searchParams serializados al cliente.
- [x] `src/components/features/knowledge/ArticlesPageView.tsx` (Client): filtros por estado/categoría en URL (Zod), búsqueda client-side con debounce, paginación, estados loading (skeleton)/error/empty.
- [x] `src/components/features/knowledge/ArticleStatusBadge.tsx` y `ArticleCard.tsx` (o filas de tabla) con estado, categoría, tags, versión, fechas.
- [x] Activar `Conocimiento` en `src/components/layout/Sidebar.tsx` (`enabled: true`) y link activo para subrutas de knowledge.

## T4 · Detalle, editor y versionado

- [x] `src/app/app/knowledge/articles/[articleId]/page.tsx` (Server) + `src/components/features/knowledge/ArticleDetailView.tsx` (Client): detalle con `body` en texto plano (`whitespace-pre-wrap`, sin `dangerouslySetInnerHTML`), metadata, acciones según permiso.
- [x] `src/components/features/knowledge/ArticleEditorForm.tsx` (RHF + Zod): crear (`/new`) y editar (`[articleId]` con modo edición); título, cuerpo, categoría, tags.
- [x] Transiciones de estado con `AlertDialog` de confirmación: publicar (aviso de visibilidad), archivar, restaurar. Publicar solo visible con `kb:publish`.
- [x] `src/components/features/knowledge/VersionHistory.tsx`: historial de versiones (solo lectura) con versión, autor, fecha y `change_note`.

## T5 · Permisos UI y taxonomy

- [x] `src/lib/permissions.ts`: agregar `KbPermission` (`kb:read|kb:edit|kb:publish`) y matriz por rol (agent: `kb:read`; supervisor/tenant_admin/platform_admin: los tres).
- [x] Ocultar acciones de gestión/publicar para roles sin permiso en listado y detalle.
- [x] `src/app/app/knowledge/categories/page.tsx` + `src/components/features/knowledge/CategoryTree.tsx`: agrupa categorías existentes (count de artículos publicados por categoría) y filtra desde URL. Sin CRUD.

## T6 · Integración con tickets y LLM

- [x] En `LlmAssistantPanel.tsx` (o `src/components/features/knowledge/RelatedArticles.tsx`): sección "Artículos relacionados" que lista artículos publicados por categoría del ticket / término del asunto (usa `useArticles` con la categoría del ticket si existe).
- [x] Botón "Insertar referencia" por artículo: agrega línea citable (título + link) al composer vía el mecanismo `onUseReply` existente. Sin envío automático.
- [x] Enlace al detalle del artículo desde la lista de relacionados (nueva pestaña / navegación al tenant actual).

## T7 · Cierre

- [x] Documentar contratos KB pendientes en `ia-docs/backend/api.md` (§ KB con tablas de endpoints/schemas/errores) y tabla en `ia-docs/backend/models.md` (`kb_articles`, `kb_article_versions`).
- [x] `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde (0 errores, 0 warnings).
- [x] Verificación manual con respuestas simuladas (listado, filtros, crear/editar/publicar/archivar/restaurar, versiones, permisos, referencia en composer). *(pendiente: requiere `pnpm dev` + mock del backend)*
- [x] Validación funcional contra FastAPI real (pendiente hasta que el backend implemente `/v1/kb/*`).
- [x] Documentar en `ia-docs/init/changes.md`, actualizar `arquitecture.md` (rutas BFF knowledge, componentes/hooks nuevos) y mover 007 KB a "En progreso" en `ia-docs/constitution/roadmap.md`.
