# 006 · Confianza y seguridad LLM — Tasks

Estado: propuesta. Marcar `[ ]` pendiente y `[x]` al completar.

## T1 · Tipos y lógica de evaluación (sin UI)

- [x] `src/types/llm.types.ts`: agregar `LlmRiskLevel` (`low|medium|high`), `LlmRiskKind` (`low_confidence|hallucination|pii|prompt_injection|insufficient_context|policy|warning`), `LlmRisk` (`{ kind, level, message }`) y `LlmRiskEvaluation` (`{ risks, blocked }`).
- [x] Crear `src/lib/llm/confidence.ts`: `confidenceLevel(c)` con umbrales 0.8/0.6 y labels (`Alta`/`Media`/`Baja`).
- [x] Crear `src/lib/llm/injection.ts`: `detectPromptInjection(text)` con patrones conservadores (ignorar instrucciones previas, "olvidá lo anterior", "actuá como administrador", comandos, "liberá tokens", etc.) devolviendo `LlmRisk | null`.
- [x] Crear `src/lib/llm/context.ts`: `isInsufficientContext(text)` (longitud/estructura mínima) y `buildTicketContext({ subject, description, messages })` → string.
- [x] Crear `src/lib/llm/risks.ts`: `evaluateLlmRisks({ confidence, warnings, policyFlags, piiDetections, injectionRisk })` → `LlmRisk[]` ordenados por severidad; helper `hasBlockingRisk(risks)` para `prompt_injection` high.

## T2 · Componentes presentacionales

- [x] Crear `src/components/features/llm/ConfidenceBadge.tsx`: niveles high/medium/low con tokens semánticos (extraído del panel actual).
- [x] Crear `src/components/features/llm/RiskBanner.tsx`: ícono por kind, color por level, `role="alert"` en high, mensaje.
- [x] Crear `src/components/features/llm/PromptInjectionWarning.tsx`: banner destacado que explica el bloqueo y pide revisión manual.
- [x] Crear `src/components/features/llm/InsufficientContextNotice.tsx`: aviso "No hay suficiente contexto para una sugerencia confiable. Revisá manualmente."

## T3 · Integración en el panel LLM

- [ ] `TicketDetailView.tsx`: armar `contextText` (asunto + descripción + mensajes vía `useMessages`) y pasarlo como prop opcional a `LlmAssistantPanel`.
- [ ] `LlmAssistantPanel.tsx`: evaluar riesgos por cada salida (clasificar, resumir, chat, sugerencias, streaming) usando `evaluateLlmRisks`.
- [ ] Mostrar `RiskBanner` por riesgo y `PromptInjectionWarning` si hay injection high.
- [ ] Bloquear apply: deshabilitar "Usar en respuesta" / "Usar sugerencia" cuando `hasBlockingRisk`, con texto explicativo visible.
- [ ] Mostrar `InsufficientContextNotice` en pestañas de generación cuando aplique.
- [ ] Reemplazar `ConfidenceBadge`/`WarningList` inline por los componentes nuevos (sin perder funcionalidad).
- [ ] Mantener intactos: tabs, feedback, redacción PII, streaming, cancelación.

## T4 · Integración y cierre

- [ ] `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde (0 errores, 0 warnings).
- [ ] Verificación manual con datos de prueba de la spec (bajo contexto, injection, PII, flujo normal).
- [ ] Documentar en `ia-docs/init/changes.md` y actualizar `arquitecture.md` (módulo `src/lib/llm/`, componentes nuevos).
- [ ] Marcar tareas aquí y mover 006 a "Hecho" en `ia-docs/constitution/roadmap.md`.
