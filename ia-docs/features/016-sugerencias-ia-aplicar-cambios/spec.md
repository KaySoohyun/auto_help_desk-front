# Spec: Panel IA — Sugerencias de Clasificación y Resumen con "Aplicar cambios"

## 1. Nombre de la feature
**016 · Panel IA — Sugerencias (Clasificación + Resumen) unificadas con "Aplicar cambios", persistencia y consumo al re-entrar.**

## 2. Contexto y problema
En la feature 015 (puntos 4 y siguientes) se reorganizó el panel "Asistente IA" del detalle de ticket del agente. Al revisarlo en profundidad, el usuario detectó que la "clasificación sugerida" **no lleva a ningún lado**: solo mostrada como propuesta visual + feedback (`action=edited/accepted`) que no toca los campos reales del ticket.

Requisitos del usuario (nuevos, expanden el alcance de 015):
1. **Unificar Clasificación + Resumen** en una sección de sugerencias, con **tres datos**: Categoría, Prioridad y Resumen.
2. Cada una con el conjunto de controles: **Aplicar cambios / Editar / Regenerar**.
3. **Eliminar** `subcategory`, `intent` y `rationale` del flujo de sugerencias (UI y output).
4. **"Aplicar cambios"** escribe en el ticket real: `category` + `priority` (desde la clasificación). Se guarda el valor aplicado.
5. **Persistir en backend + consumir al re-entrar**: los datos quedan en `ai_suggestions` y se cargan al entrar (no se regenera automáticamente).
6. **Bloqueo de salida suave**: banner/indicador de "pendientes" + confirmación al intentar salir; aplica a Clasificación + Resumen (no a la respuesta sugerida).
7. **Regla de "sin cambios"**: al re-entrar con sugerencia resuelta, la **clasificación se oculta** hasta que el usuario inicie manualmente; el **resumen se muestra siempre** (en lectura si está resuelto).

## 3. Estado actual (código)
- `ai_suggestions` guarda por ticket y tipo (`classification` | `summary` | `reply`) un `output` JSON y un `state` (`draft|accepted|edited|rejected|flagged`).
- `GET /v1/ai/tickets/{id}/suggestions` existe en backend pero el frontend **nunca lo consume**.
- `POST /v1/ai/tickets/{id}/analyze` regenera las 3 sugerencias (draft) en cada llamada; el frontend lo llama automáticamente al entrar.
- `POST /v1/ai/tickets/{id}/feedback` solo registra `action`/`reason`/`edited_content_hash` y actualiza `state`; **no toca el ticket real**.
- El ticket real (`tickets`): `category` y `priority` son actualizables vía `PATCH /tickets/{id}` (`TicketUpdatePayload`). **No existe campo de resumen en el ticket.**
- El frontend carga `LlmAnalyzeOutput` desde `analyze` en cada visita (`LlmAssistantPanel`).

## 4. Alcance

### 4.1 In scope
- Rehacer la sección de sugerencias del panel IA: Clasificación + Resumen en una UI unificada con los 3 datos (Categoría, Prioridad, Resumen) y controles Aplicar/Editar/Regenerar.
- Eliminar `subcategory`, `intent`, `rationale` de la UI y del output persistido de clasificación.
- Botón "Aplicar cambios": persiste `category`+`priority` al ticket real (clasificación) y guarda el resumen aplicado/editado (sugerencia). Actualiza states (`accepted`/`edited`).
- Consumir sugerencias guardadas al re-entrar (`GET /suggestions`), sin regenerar automáticamente; solo regenerar si el usuario lo pide.
- Regla de visibilidad: clasificación oculta si resuelta; resumen siempre visible (lectura si resuelto).
- Banner/indicador de pendientes + confirmación de salida (Clasificación + Resumen).
- Backend: cambios necesarios en contratos/servicios para persistir el valor aplicado y el resumen editado.

### 4.2 Out of scope
- No se toca la respuesta sugerida (queda como feature 015 T15: Regenerar / Usar como respuesta).
- No cambio del modelo multi-agente.
- No se introduce `subcategory/intent/rationale` nuevos.
- No cambios al portal cliente ni permisos.

## 5. Requisitos funcionales

### FR-01 · Sección de sugerencias unificada
- Una sola sección "Sugerencias" en el panel IA con tres datos editables/aplicables:
  - **Categoría** (texto/select sobre `ticket.category`).
  - **Prioridad** (select sobre `PRIORITY_LABELS`).
  - **Resumen** (textarea).
- Cada dato se muestra con su valor y un control kebab/menú con **Aplicar cambios · Editar · Regenerar** (o acciones por dato cuando proceda).
- **Botón "Aplicar cambios"**: es un **icon button** ubicado **al lado del menú kebab**.
- **Visibilidad del botón Aplicar**: el botón "Aplicar cambios" **solo se muestra mientras haya cambios sin guardar** (estado pendiente/draft); una vez aplicados/guardados (state `accepted`/`edited`) el botón se oculta y queda solo el menú kebab.

### FR-02 · Eliminación de subcategory/intent/rationale
- La UI de clasificación ya no muestra ni edita `subcategory`, `intent`, `rationale`.
- El output persistido de la sugerencia de clasificación se reduce a `{ category, suggested_priority, confidence, ... }`.

### FR-03 · Aplicar cambios
- **Clasificación**: escribe `ticket.category` y `ticket.priority` (valor aplicado) vía `PATCH /tickets/{id}`; marca la sugerencia de clasificación `state=accepted` (feedback).
- **Resumen**: persiste el resumen (aplicado/editado) en `output` de la sugerencia; marca `state=edited` (si editado) o `accepted` (si aceptado sin cambios).
- "Siempre guardar el valor aplicado": tanto el valor de clasificación (en el ticket) como el resumen (en la sugerencia) se persisten.

### FR-04 · Consumo al re-entrar
- Al entrar al ticket, el panel **carga las sugerencias guardadas** (`GET /suggestions`) y no regenera automáticamente.
- Si no hay pendientes (`state` resuelto o sin sugerencia), no se ofrece "Aplicar"; se muestra según la regla de visibilidad.
- Regenerar → crea nueva sugerencia (draft) y reemplaza el estado pendiente.

### FR-05 · Regla de visibilidad ("sin cambios")
- **Clasificación**: solo visible si está pendiente (draft) o en edición; si está resuelta (accepted/edited/rejected) se **oculta** hasta que el usuario inicie manualmente (p. ej. botón "Analizar"/"Editar" que abre un nuevo flujo draft).
- **Resumen**: **siempre visible**; en lectura si está resuelto, editable/aplicable si está pendiente.

### FR-06 · Bloqueo de salida suave
- Indicador/banner de "hay cambios pendientes" (Clasificación o Resumen en draft sin aplicar).
- Al intentar salir (volver, navegar, cerrar) con pendientes → **confirmación** antes de continuar.
- No bloquea totalmente; es un aviso suave (window.confirm o dialog) que permite al usuario decidir.

## 6. Criterios de aceptación
- Navegando como agente en `/acme-corp/app/tickets/11`:
  - Sección "Sugerencias" con Categoría, Prioridad y Resumen; sin `subcategory/intent/rationale`.
  - "Aplicar cambios" en clasificación escribe `category`+`priority` reales del ticket (visibles en Propiedades) y marca `accepted`.
  - El resumen aplicado/editado queda guardado; se muestra en lectura al re-entrar.
  - Al re-entrar: si la clasificación está resuelta se oculta; el resumen se ve siempre.
  - Banner de pendientes + confirmación al intentar salir con sugerencias sin resolver.
- Backend: tests/suite del backend en verde; contratos de `GET /suggestions` y persistencia coherentes.
- `pnpm lint` sin warnings y `pnpm typecheck` OK.

## 7. Riesgos y mitigaciones
| Riesgo | Mitigación |
|---|---|
| El ticket no tiene campo de resumen | El resumen se persiste en el output de la sugerencia, no en el ticket |
| Cambio de contrato del output de clasificación (quitar subcategory/intent/rationale) | Actualizar tipos frontend + servicios/parseo backend + migración/seed si aplica |
| Romper la auto-carga actual (analyze al entrar) | Reemplazarla por carga desde `GET /suggestions`; regenerar solo manual |
| Bloqueo de salida que moleste | Suave (banner + confirmación), sin bloquear forzosamente |
| Datos persistidos duplicados al regenerar | Mantener una sugerencia activa por tipo/ticket; regenerar reemplaza o versiona con `state` |
