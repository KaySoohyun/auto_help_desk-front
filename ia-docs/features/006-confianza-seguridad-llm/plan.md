# 006 · Confianza y seguridad LLM — Plan

**Objetivo:** dotar al panel LLM de un cinturón de seguridad: riesgos estructurados, warning de prompt injection con bloqueo de apply, bajo contexto y confidence standalone. Sin endpoints nuevos.

## Enfoque

1. **Lógica pura y testeable en `src/lib/llm/`** (confidence, risks, injection, context) — sin UI.
2. **Componentes presentacionales** en `src/components/features/llm/` — sin lógica de negocio.
3. **Integración mínima en el panel** (`LlmAssistantPanel.tsx`) y paso de contexto desde `TicketDetailView.tsx`.
4. Tipos nuevos en `src/types/llm.types.ts`; no se tocan los contratos BFF ni los tipos de respuesta del backend.

## Fuentes

- Spec de esta feature (`spec.md`).
- Etapa 2.3 de `ia-docs/init/plan.md` (ConfidenceBadge, riesgos, PII, prompt injection, bloqueo de apply, bajo contexto).
- `conventions.md` § LLM responsable y § a11y.
- Espec 006 de `ia-docs/constitution/roadmap.md`.

## Riesgos / supuestos

- La heurística de injection es client-side y conservadora: puede dar falsos positivos (bloqueo preventivo, siempre revisable). No reemplaza los guardrails del backend.
- No hay endpoint de riesgo en el backend: toda la evaluación es composición frontend sobre datos ya devueltos.
- La prop `contextText` es opcional: si el padre no la pasa, la detección de injection/bajo contexto se degrada sin romper.

## Orden de implementación

1. T1 — Tipos y lógica (sin UI).
2. T2 — Componentes presentacionales.
3. T3 — Integración en panel + paso de contexto.
4. T4 — Cierre: build/lint/typecheck, docs y roadmap.

## Criterios de aceptación

Ver `spec.md`. Resumen: confidence standalone, risk banners, injection warning con bloqueo de apply, bajo contexto, PII como riesgo, todo en verde.
