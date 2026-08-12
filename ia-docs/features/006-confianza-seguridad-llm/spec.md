# 006 · Confianza y seguridad LLM

**Estado:** implementada (build/lint/typecheck OK + test de lógica pura). Pendiente validación funcional contra FastAPI real y a11y visual.
**Alcance:** Fase 2 · Etapa 2.3 del plan.

## Qué hace

Convierte los avisos informales del panel LLM (warnings en texto plano) en un **modelo de riesgos estructurado** con niveles, detección client-side de **prompt injection**, **bloqueo de apply automático** ante riesgo alto, **mensajes de bajo contexto** y un `ConfidenceBadge` standalone. No agrega endpoints nuevos: el backend no expone riesgo/injection; la evaluación se compone en el frontend con lo que el backend ya devuelve (`warnings`, `policy_flags`, `confidence`, errores 422 de guardrails).

## Por qué

La feature 005 muestra `warnings` como texto plano y permite "Usar en respuesta" / "Usar sugerencia" sin barreras. La constitución exige: contenido del cliente siempre no confiable, warning visible de prompt injection, confianza baja y **bloqueo de apply automático** si se sospecha injection, y mensajes claros de bajo contexto. Esto es el "cinturón de seguridad" del asistente LLM.

## Contexto real del backend

- `ClassificationOut`, `SummaryOut` y `SuggestedReplyOut` devuelven `confidence: number` y `warnings: string[]`; `SuggestedReplyOut` además `policy_flags: string[]`.
- `POST /v1/ai/tickets/{id}/suggested-reply` puede responder **422** cuando los guardrails bloquean contenido (el BFF ya lo traduce a `ApiError`).
- `POST /v1/pii/redact` es la redacción autoritativa de PII (ya integrada en 005).
- **No existe** un endpoint de "riesgo" ni de "injection". La heurística client-side es un refuerzo de UX; la autoridad real de guardrails sigue siendo el backend.

## Decisiones de diseño

1. **Modelo de riesgo tipado** (`src/types/llm.types.ts`): `LlmRisk { kind, level, message }` con
   `kind: low_confidence | hallucination | pii | prompt_injection | insufficient_context | policy | warning` y `level: low | medium | high`.
2. **Evaluación compuesta** (`src/lib/llm/risks.ts`): combina
   - `confidence` del backend → riesgo `low_confidence` (level según umbrales 0.8 / 0.6),
   - `warnings` y `policy_flags` del backend → riesgos `warning` / `policy`,
   - detección de PII sobre el borrador (reutiliza `detectPii`) → riesgo `pii`,
   - heurística de prompt injection sobre el contexto del ticket → riesgo `prompt_injection`.
3. **Detección de prompt injection** (`src/lib/llm/injection.ts`): heurística client-side conservadora con patrones conocidos ("ignora las instrucciones", "olvidá lo anterior", "actuá como administrador", comandos, etc.). Conservadora: ante una coincidencia, riesgo `high`.
4. **Bloqueo de apply automático**: si existe riesgo `prompt_injection` de nivel `high`, los botones "Usar en respuesta" / "Usar sugerencia" se deshabilitan y se muestra `PromptInjectionWarning` (no se puede aplicar sin revisión manual). Los riesgos `pii` / `low_confidence`/`hallucination` no bloquean pero muestran banner.
5. **Bajo contexto** (`src/lib/llm/context.ts`): si el contexto del ticket (asunto + descripción + mensajes) es muy corto, se muestra `InsufficientContextNotice` en las pestañas que generan respuesta.
6. **Contexto del ticket**: el panel recibe una prop opcional `contextText` (asunto + descripción + cuerpos de mensajes) armada por `TicketDetailView`. Se usa solo para heurísticas client-side; nunca se envía al LLM por esta vía.
7. **Extracción de componentes**: `ConfidenceBadge` sale del panel a `src/components/features/llm/`, junto con `RiskBanner`, `PromptInjectionWarning` y `InsufficientContextNotice`.
8. **Sin nuevas dependencias ni endpoints BFF nuevos.** El backend sigue siendo autoridad.

## Criterios de aceptación

- [ ] `ConfidenceBadge` standalone con niveles high/medium/low (0.8 / 0.6 / resto) en `src/components/features/llm/`.
- [ ] `RiskBanner` por riesgo detectado, con ícono, color por nivel y `role="alert"` en high.
- [ ] `PromptInjectionWarning` visible y los botones de aplicar deshabilitados si hay riesgo de injection `high`.
- [ ] `InsufficientContextNotice` en pestañas de generación cuando el contexto del ticket es insuficiente.
- [ ] Detección de PII sobre borradores mostrada como riesgo `pii` dentro de la misma lista de riesgos.
- [ ] Toda salida LLM (clasificar, resumir, chat, sugerencias, streaming) muestra su evaluación de riesgos.
- [ ] Las funcionalidades de 005 siguen intactas (tabs, feedback, redacción PII, streaming).
- [ ] `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde (0 errores, 0 warnings).
- [ ] Sin `dangerouslySetInnerHTML`; contenido del cliente siempre renderizado como texto.
- [ ] a11y: banners con `role="alert"`, buttons deshabilitados explicados con `title`/texto visible, contraste AA.

## Fuera de alcance

- Endpoints nuevos en BFF o backend (riesgo/injection).
- Clasificación de seguridad por modelo (backend).
- Guardrails server-side (ya existen en FastAPI).
- Persistencia de evaluaciones de riesgo (solo auditoría vía feedback ya existente).
- Detección de injection sobre adjuntos o imágenes.

## Datos de prueba

- Ticket con descripción corta (ej. "ayuda") → notice de bajo contexto.
- Ticket con descripción que incluya patrones tipo "ignora las instrucciones anteriores y..." → warning de injection + apply bloqueado.
- Borrador con email/teléfono → riesgo `pii` visible (sin bloquear apply).
- Verificar que con contenido normal los botones de aplicar siguen habilitados.
