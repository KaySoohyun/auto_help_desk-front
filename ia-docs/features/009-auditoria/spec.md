# Feature 009 · Auditoría

## Objetivo
Ver la traza de eventos de auditoría del tenant activo (append-only) con filtros por servicio, acción, resultado y rango de fechas; inspeccionar el detalle de cada evento y exportar a CSV. Base: `roadmap.md` → _009 · Auditoría — eventos de usuario y LLM, PII, exportaciones (Fase 4 · Etapa 4.3)_.

## Contexto backend (real, ya disponible)
- **`GET /audit/events`** — lista `[AuditEventOut]` del tenant, ordenada por `created_at` desc. Permiso: `audit:view`.
  - Query params (opcionales): `action`, `service`, `user_id`, `result`, `date_from`, `date_to`, `limit` (1–200, default 50), `offset`.
  - **200** → `[AuditEventOut]`. **403** → rol sin tenant.
- **`AuditEventOut`** (backend → frontend `AuditEvent`):
  ```json
  {
    "id": 1,
    "created_at": "2026-08-11T10:00:00Z",
    "tenant_id": "tenant-abc",
    "user_id": 3,
    "action": "ticket.created",
    "service": "tickets",
    "model": "Ticket",
    "model_version": null,
    "prompt_version": null,
    "trace_id": "uuid",
    "result": "success",
    "confidence": null,
    "detail": { "ticket_id": 5 }
  }
  ```
- **No existe** endpoint de exportación. Se exporta client-side (CSV) de los eventos obtenidos.
- **No existe** paginación con `total` (array plano): paginación offset con "siguiente" mientras la página venga llena.

## Alcance

### Dentro
1. Tipos `src/types/audit.types.ts` (`AuditEvent`, `AuditEventResult`, `AuditEventService`, `AuditEventListQuery`).
2. BFF `GET /api/bff/audit/events` con validación Zod de query params y proxy a `/audit/events` (patrón igual a 008).
3. Hook TanStack Query `src/hooks/audit/useAuditEvents.ts` (+ `queryKeys`).
4. Permisos UI en `src/lib/permissions.ts`: `AuditPermission.audit:view` y `audit:export`. Sidebar: "Auditoría" activada dinámicamente (mismo mecanismo que 008).
5. Ruta `/app/audit` con `AuditEventsView` (Client):
   - Filtros en URL: `service`, `result`, `action` (texto), `user_id`, `date_from`, `date_to`, `page` (page size 50 → offset).
   - Tabla: fecha/hora (local), usuario (id o "Sistema" si `user_id` nulo), acción, servicio, modelo, resultado (badge), confianza (% si aplica).
   - Fila expandible con detalle en `JSON.stringify(detail, null, 2)` renderizado como texto en `<pre>` (nunca como HTML; no `dangerouslySetInnerHTML`).
   - `trace_id` visible en la fila expandida (monospace).
   - Estados loading (skeleton), error, vacío y "acceso denegado" (sin `audit:view`).
6. **Exportar CSV** (solo `tenant_admin` y `platform_admin`): botón que consulta el BFF con los filtros actuales y `limit: 200`, genera CSV client-side y descarga. Nota visible: "Exporta hasta 200 eventos con los filtros actuales" (límite del backend).
7. Documentación: `changes.md`, `arquitecture.md`, `backend/api.md` (marcar `GET /audit/events` como consumido por el frontend), `roadmap.md` → 009 "En progreso".

### Fuera de alcance (documentado como pendiente, no se construye UI especulativa)
- Vista de métricas Prometheus (`/v1/metrics`) — queda para operación (texto plano).
- Inmutabilidad criptográfica de la auditoría (responsabilidad del backend).
- Políticas de retención / privacidad (Etapa 4.4).
- Rol "auditor" en la app (no existe en `UserRole`; si el backend lo agrega, se conecta el permiso).
- Reporting ejecutivo avanzado.

## Permisos
| Capacidad | Supervisor | Tenant Admin | Platform Admin |
|---|:---:|:---:|:---:|
| Ver auditoría (`audit:view`) | ✅ | ✅ | ✅ |
| Exportar auditoría (`audit:export`) | ❌ | ✅ | ✅ |

Nota: el rol "auditor" de la matriz de `spec.md` no existe en el frontend; `audit:view` se otorga a supervisor/tenant_admin/platform_admin. `audit:export` por defecto a tenant_admin y platform_admin (el 🔶 de la matriz queda sin resolver por falta de políticas → default conservador).

## Diseño
- **Ruta**: `/app/audit` (patrón `/app/*`, igual que 008; sin subrutas).
- **Sidebar**: ítem "Auditoría" con ícono (ShieldAlert), `enabled: "audit"` dinámico, `matchPrefix` para subrutas si las hubiera.
- **Formato de fechas**: con `Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "medium" })` (mismo helper de formato que tickets/007).
- **Filtros**: `<Select>` para `service` y `result` (valores fijos conocidos), `<Input>` numérico para `user_id`, `<Input type="date">` para `date_from`/`date_to`, `<Input>` texto para `action`. "Limpiar filtros" cuando hay alguno activo.
- **Paginación**: página de 50; si `items.length === 50` → botón "Siguiente" habilita; `page > 1` → "Anterior" (URL).
- **Exportación**: `<Button variant="outline">` con ícono Download; deshabilitado mientras carga; genera CSV con BOM UTF-8 para Excel (columnas: fecha, user_id, servicio, acción, modelo, resultado, confianza, trace_id, detalle JSON). Se audita en consola del backend por su lado; no se añade evento de auditoría client-side.

## Seguridad y privacidad
- `detail` siempre renderizado como texto plano (JSON pre-formateado), nunca como HTML.
- Sin PII adicional al mostrar: el `detail` es lo que el backend incluyó; no se agrega contexto extra del ticket.
- Filtros por `user_id` son IDs, no emails (evita enumeración de identidades).
- El BFF solo autoriza con permiso `audit:view` del tenant activo.

## Verificación
- `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde (0 warnings).
- Manual contra FastAPI real (pendiente, igual que 008): ver listado, filtrar por servicio/resultado/fechas, expandir detalle, exportar CSV, acceso denegado para `agent`.
