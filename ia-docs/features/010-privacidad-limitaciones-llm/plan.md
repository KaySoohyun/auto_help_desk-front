# Feature 010 · Privacidad, retención y límites LLM — Plan

## Contexto
- Backend real: `GET/PUT /admin/ai-policy` (tenant, `CONFIGURE_TENANT`), `GET/PUT /admin/ai-policies/global` (solo `platform_admin`), `GET /v1/ai/info` (solo lectura, `audit:view`).
- Sin backend: retención, preferencias de privacidad, config de redacción PII → solo documentar.
- Rutas `/app/admin/*` bajo el nav "Administración" (`matchPrefix: true`).

## Estrategia
Reutilizar patrones de 008/009 (tipos, BFF Zod+`authenticatedFetch`, hooks TanStack Query con mutaciones e invalidación, permisos en `permissions.ts`, página `/app/admin/*` con vista Client). Formularios con estado local (sin RHF `watch()`).

1. **T1 · Tipos y BFF** — `src/types/admin.types.ts` (AdminAiPolicy, GlobalAiPolicy, OrchestratorInfo + updates) y rutas BFF `ai-policy` (GET/PUT), `ai-policies/global` (GET/PUT), `ai-info` (GET).
2. **T2 · Hooks y permisos** — `src/hooks/admin/queryKeys.ts` + `useAiPolicy`, `useUpdateAiPolicy`, `useGlobalAiPolicy`, `useUpdateGlobalAiPolicy`, `useAiInfo`; `AdminPermission` extiende con `ai:configure` y `ai:configure-global`.
3. **T3 · UI política tenant** — componente de card con toggle `ai_enabled` (Checkbox), `tone`, `language`, editor de tags para `allowed_categories`, filas clave→valor para `escalation_rules`, guardar con toast y estados.
4. **T4 · UI política global + orquestador** — card global (editable solo `ai:configure-global`, deshabilitada con nota para `tenant_admin`) y card read-only del orquestador con "Actualizar".
5. **T5 · Página y sub-nav** — `AdminLlmView` (estados loading/error/denegado), `/app/admin/llm/page.tsx`, sub-nav "Usuarios | Configuración LLM" en `/app/admin/users` y `/app/admin/llm`. Build/lint/typecheck.
6. **T6 · Docs y cierre** — `changes.md`, `arquitecture.md`, `backend/api.md` (marcar consumidos, documentar pendientes), `roadmap.md` → 010 "En progreso", tasks, verificación final.

## Verificación
- `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde (0 warnings) tras cada etapa.
- Manual contra FastAPI real pendiente (se deja sin marcar en tasks).
