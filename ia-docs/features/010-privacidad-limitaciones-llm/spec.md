# Feature 010 · Privacidad, retención y límites LLM

## Objetivo
Configurar la política de IA del tenant y la política global del orquestador, y ver el estado de configuración del LLM (límites de rate, modelo, proveedor). Documentar como pendientes retención, privacidad del usuario y configuración de redacción de PII. Base: `roadmap.md` → _010 · Privacidad, retención y límites LLM — políticas y configuración (Fase 4 · Etapa 4.4)_.

## Contexto backend (real, ya disponible)
- **`GET/PUT /admin/ai-policy`** — política IA del tenant (`TenantPolicyOut`). Permiso: `CONFIGURE_TENANT` (`tenant_admin`/`platform_admin`).
  ```json
  {
    "tenant_id": "tenant-abc",
    "ai_enabled": true,
    "tone": "profesional",
    "language": "es",
    "allowed_categories": ["billing", "technical"],
    "escalation_rules": { "urgent": "supervisor" },
    "updated_at": "2026-08-11T10:00:00Z"
  }
  ```
  `PUT` body: campos opcionales, `ai_enabled` default `true`, `tone` ≤50 chars, `language` ≤10.
- **`GET/PUT /admin/ai-policies/global`** — política global efectiva (`GlobalPolicyOut`). Permiso: `ai_policies:manage` (solo `platform_admin`).
  ```json
  { "llm_model": "gpt-4o-mini", "ai_confidence_threshold": 0.6, "guardrails_enabled": true, "llm_rate_max_calls": 60 }
  ```
  `PUT`: solo persiste los campos enviados. `ai_confidence_threshold` 0.0–1.0, `llm_rate_max_calls` ≥1.
- **`GET /v1/ai/info`** — config del orquestador sin secretos. Permiso: `audit:view`.
  ```json
  { "provider": "mock", "model": "gpt-4o-mini", "rate_max_calls": 60, "rate_window_seconds": 60, "max_retries": 2 }
  ```

### No existe (se documenta, sin UI)
- Políticas de **retención** de datos (Etapa 4.4 del plan).
- Preferencias de **privacidad del usuario**.
- Configuración de **redacción de PII por tenant** (modo default `off|detect|redact`, tipos a redactar). La redacción puntual ya se consume en el panel LLM (`/api/bff/llm/pii-redact`).

## Alcance

### Dentro
1. Tipos `src/types/admin.types.ts`: `AdminAiPolicy`/`AdminAiPolicyUpdate`, `GlobalAiPolicy`/`GlobalAiPolicyUpdate`, `OrchestratorInfo`.
2. BFF:
   - `GET/PUT /api/bff/admin/ai-policy` → `/admin/ai-policy` (Zod: `tone` ≤50, `language` ≤10, `allowed_categories` array de strings ≤50, `escalation_rules` record string→string).
   - `GET/PUT /api/bff/admin/ai-policies/global` → `/admin/ai-policies/global` (Zod: `ai_confidence_threshold` 0–1, `llm_rate_max_calls` ≥1).
   - `GET /api/bff/admin/ai-info` → `/v1/ai/info` (solo lectura).
3. Hooks TanStack Query `src/hooks/admin/`: `useAiPolicy`, `useUpdateAiPolicy`, `useGlobalAiPolicy`, `useUpdateGlobalAiPolicy`, `useAiInfo`. Query keys `['tenant', tenantId, 'admin', 'ai-policy'|'ai-policies/global'|'ai-info']`.
4. Permisos UI en `src/lib/permissions.ts`: `AdminPermission` extiende con `ai:configure` (`tenant_admin`/`platform_admin`) y `ai:configure-global` (solo `platform_admin`).
5. UI `/app/admin/llm` (`AdminLlmView`):
   - **Política IA del tenant** (editable con `ai:configure`): switch `ai_enabled` (Checkbox), `tone` (≤50), `language` (≤10), `allowed_categories` (editor de tags: input + Enter/Agregar, chips con quitar), `escalation_rules` (filas clave→valor con agregar/quitar). Botón "Guardar".
   - **Política global** (editable solo con `ai:configure-global`; `tenant_admin` la ve deshabilitada con nota): `llm_model`, `ai_confidence_threshold` (0–1), `guardrails_enabled`, `llm_rate_max_calls`. Botón "Guardar".
   - **Estado del orquestador** (solo lectura): `provider`, `model`, `rate_max_calls`, `rate_window_seconds`, `max_retries` + botón "Actualizar".
   - Estados loading (skeleton), error con reintentar, y "acceso denegado" (sin `users:read`).
   - Formularios con estado local (no RHF `watch()`, evita warning `react-hooks/incompatible-library`).
6. Sub-nav de administración en `/app/admin/users` y `/app/admin/llm`: enlaces "Usuarios" y "Configuración LLM" (según permisos).
7. Docs: `changes.md`, `arquitecture.md`, `backend/api.md` (marcar `ai-policy` y `ai-policies/global` como consumidos; retención/privacidad/redacción como pendientes), `roadmap.md` → 010 "En progreso".

### Fuera de alcance (documentado como pendiente)
- Políticas de retención, preferencias de privacidad del usuario, configuración de redacción PII por tenant (sin backend → sin UI especulativa).
- Métricas Prometheus (`/v1/metrics`) — operación.

## Permisos
| Capacidad | Tenant Admin | Platform Admin |
|---|:---:|:---:|
| Ver página `/app/admin/llm` (`users:read`) | ✅ | ✅ |
| Editar política IA del tenant (`ai:configure`) | ✅ | ✅ |
| Editar política global (`ai:configure-global`) | ❌ | ✅ |
| Ver estado del orquestador (`audit:view` en backend) | ✅ | ✅ |

## Seguridad y privacidad
- La política global no expone secretos (la del backend ya filtra). No se muestran claves/API keys.
- Sin PII en la UI: categorías y reglas de escalado son config, no datos de clientes.
- El BFF valida rangos (threshold 0–1, rate ≥1, tone ≤50, language ≤10) antes de llamar a FastAPI.
- Guardar política es una mutación con feedback (toast) y estados de guardado.

## Verificación
- `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde (0 warnings).
- Manual contra FastAPI real (pendiente): leer/editar política tenant, editar global como `platform_admin`, bloqueo de edición global como `tenant_admin`, info del orquestador, tags de categorías y reglas de escalado.
