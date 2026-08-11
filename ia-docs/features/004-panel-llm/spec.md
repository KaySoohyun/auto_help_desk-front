# 004 · Panel LLM base

**Estado:** propuesta

## Qué hace

Un panel lateral (sidebar) que permite al agente/ supervisor interactuar con un modelo de lenguaje para:
- Clasificar tickets con categorías/etiquetas sugeridas por la IA.
- Resumir hilos de mensajes largos.
- Generar respuestas tipo "copiar/pegar" para tickets.

Incluye disclaimer humano en pantalla y logging de todas las interacciones para auditoría.

## Por qué

Los agentes pierden tiempo leyendo y clasificando manualmente tickets. Un panel LLM asistido acelera la triaje y reduce errores de categorización, manteniendo el control humano en el loop (humano-in-the-loop).

## Contexto real del backend (contratos de `ia-docs/backend/api.md`)

- `POST /v1/llm/classify` → recibe texto de ticket, devuelve categorías sugeridas con scores.
- `POST /v1/llm/summarize` → recibe texto de conversación, devuelve resumen bullets.
- `POST /v1/llm/chat` → chat simple con historial, devuelve mensaje IA.
- Todos los endpoints requieren `Authorization: Bearer <token>` y validan tenant.
- Errores: 401 token inválido/expired, 429 rate limit, 400 texto vacío o demasiado largo.

## Decisiones de adaptación (a aprobar)

1. **Disclaimer humano obligatorio**: cada salida de la IA debe mostrarse con un badge de advertencia y botón "Descartar".
2. **Logging auditado**: toda llamada LLM se guarda en `llm_interactions` tabla con: usuario, tenant, input text hash, output, timestamp, éxito/fallo.
3. **Rate limiting client**: el frontend respeta headers `X-RateLimit-Remaining` y muestra un mensaje amable si se excede.
4. **Contexto limitado**: el texto enviado al LLM se trunca a 3000 caracteres para evitar costos excesivos y filtros de PII.
5. **Sin streaming todavía**: Fase 1 usa polling simple; el streaming avanzado queda para Fase 2.

## Criterios de aceptación

- [ ] Panel lateral en `/app` (izquierda, debajo de sidebar) con 3 pestañas: Clasificar, Resumir, Chat.
- [ ] Cada pestaña tiene disclaimer humano visible y botón "Descartar".
- [ ] `POST /api/bff/llm/classify` integra el endpoint backend con Zod validation.
- [ ] `POST /api/bff/llm/summarize` integra el endpoint backend.
- [ ] `POST /api/bff/llm/chat` integra el endpoint backend.
- [ ] Logging automático en cada operación LLM (usuario, tenant, éxito/fallo).
- [ ] Estados: loading (skeleton), error (mensaje + reintentar), vacío.
- [ ] Contenido en español; errores traducidos.
- [ ] `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde.
- [ ] Sin `dangerouslySetInnerHTML` (usar sanitized text only).
- [ ] a11y: labels/aria en inputs, contraste AA, focus management.

## Fuera de alcance

- Streaming LLM en tiempo real → Fase 2.
- Guardrails complejos de PII (se evalúa en Fase 2).
- Integración con modelos locales o privada.
- Autenticación LLM propia (usa el mismo token de sesión).
- Modo claro (solo oscuro por ahora).

## Datos de prueba

- Usuario con rol agent/supervisor y tenant asignado.
- Tickets con hilos de mensajes suficientes para probar clasificación y resumen.
- Verificar que los logs aparecen en el backend y son consultables por auditores.