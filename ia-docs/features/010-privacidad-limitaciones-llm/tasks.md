# Feature 010 · Privacidad, retención y límites LLM — Tasks

## T1 · Tipos y BFF

- [ ] Agregar a `src/types/admin.types.ts`: `AdminAiPolicy`/`AdminAiPolicyUpdate`, `GlobalAiPolicy`/`GlobalAiPolicyUpdate`, `OrchestratorInfo`.
- [ ] Crear `src/app/api/bff/admin/ai-policy/route.ts`: `GET`/`PUT` con Zod (`tone` ≤50, `language` ≤10, `allowed_categories` array ≤50, `escalation_rules` record), proxy a `/admin/ai-policy`.
- [ ] Crear `src/app/api/bff/admin/ai-policies/global/route.ts`: `GET`/`PUT` con Zod (`ai_confidence_threshold` 0–1, `llm_rate_max_calls` ≥1), proxy a `/admin/ai-policies/global`.
- [ ] Crear `src/app/api/bff/admin/ai-info/route.ts`: `GET` → `/v1/ai/info`.

## T2 · Hooks y permisos

- [ ] Extender `src/hooks/admin/queryKeys.ts` con keys de `ai-policy`, `ai-policies/global` y `ai-info`.
- [ ] Crear hooks: `useAiPolicy`, `useUpdateAiPolicy`, `useGlobalAiPolicy`, `useUpdateGlobalAiPolicy`, `useAiInfo` (mutaciones con invalidación).
- [ ] Extender `AdminPermission` en `src/lib/permissions.ts`: `ai:configure` (`tenant_admin`/`platform_admin`) y `ai:configure-global` (solo `platform_admin`).

## T3 · UI política IA del tenant

- [ ] Card de política del tenant: Checkbox `ai_enabled`, Inputs `tone`/`language`, editor de tags `allowed_categories` (Enter/Agregar + quitar), filas `escalation_rules` (agregar/quitar), botón Guardar con toast y estados (estado local, sin `watch()`).

## T4 · UI política global + orquestador

- [ ] Card de política global: `llm_model`, `ai_confidence_threshold` (0–1), `guardrails_enabled`, `llm_rate_max_calls`; editable solo con `ai:configure-global`, deshabilitada con nota para `tenant_admin`.
- [ ] Card read-only del orquestador (`provider`, `model`, `rate_max_calls`, `rate_window_seconds`, `max_retries`) con botón "Actualizar".

## T5 · Página y sub-nav

- [ ] `AdminLlmView` con estados loading/error/acceso denegado y `src/app/app/admin/llm/page.tsx`.
- [ ] Sub-nav "Usuarios | Configuración LLM" en `/app/admin/users` y `/app/admin/llm`.
- [ ] `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde.

## T6 · Docs y cierre

- [ ] Actualizar `ia-docs/init/changes.md` (entrada 010), `ia-docs/init/arquitecture.md` (BFF, AdminLlmView, sub-nav), `ia-docs/backend/api.md` (marcar `ai-policy`/`ai-policies/global`/`ai/info` como consumidos; retención/privacidad/redacción PII como pendientes).
- [ ] Mover 010 a "En progreso" en `ia-docs/constitution/roadmap.md`.
- [ ] Verificación manual contra FastAPI real *(pendiente: requiere `pnpm dev` + backend)*.
- [ ] Build/lint/typecheck final.
