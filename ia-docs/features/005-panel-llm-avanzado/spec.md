# 005 · Panel LLM avanzado

**Estado:** implementada (build/lint/typecheck OK). Pendiente validación funcional contra FastAPI real y a11y (ver `tasks.md` T4).

## Qué hace

Extiende el panel LLM base (004) con capacidades de streaming en tiempo real, sugerencias automáticas en el composer de tickets, y controles de aceptar/editar/regenerar/rechazar respuestas de la IA. Incluye indicadores de confianza y bloques de seguridad contra prompt injection.

## Por qué

El panel básico requiere que el usuario envíe manualmente cada mensaje. Las sugerencias automáticas y el streaming reducen el tiempo de triaje y mejoran la experiencia del agente, manteniendo el control humano en el loop con disclaimers y opciones de regeneración.

## Contexto real del backend (contratos de `ia-docs/backend/api.md`)

- `POST /v1/ai/tickets/{id}/suggested-reply` → sugiere una respuesta editable (body opcional `{tone, language}`). Es el único endpoint de generación de respuesta del backend.
- `POST /v1/ai/tickets/{id}/feedback` → registra la decisión del agente sobre una sugerencia (`accepted|edited|rejected|flagged`).
- `POST /v1/ai/tickets/{id}/classify` y `/summary` → clasificar y resumir (heredados de 004).
- `POST /v1/pii/redact` → redacción de PII.
- **No existen** endpoints SSE en streaming, `/v1/llm/{stream,suggest,feedback}` (citados en una versión previa de esta spec) ni `/v1/ai/tickets/{id}/chat` o `/suggest`. El streaming se implementa como wrapping SSE + emisión chunked en el cliente (ver Decisiones).
- Todos los endpoints requieren `Authorization: Bearer <token>` y validan tenant.
- Errores: 401 token inválido/expired, 429 rate limit, 400 texto inválido, 403 IA deshabilitada, 404 ticket no encontrado.

## Decisiones de adaptación

1. **Streaming SSE simulado**: el BFF `/api/bff/llm/stream` proxya a `suggested-reply`, envuelve la respuesta como un único evento SSE `data: {...}`, y el cliente emite la respuesta **chunked** como tokens en tiempo real (con cancelación manual). Preparado para true streaming cuando el backend lo soporte.
2. **Chat alineado a `suggested-reply`**: el backend no tiene chat conversacional; la pestaña Chat genera una respuesta editable con el contexto del ticket (sin campo `message`).
3. **Sugerencias predictivas**: la pestaña Sugerencias muestra 3 respuestas en tonos `formal | empático | conciso` generadas con `suggested-reply`.
4. **Historial de feedback**: cada interacción (aceptar/editar/rechazar/regenerar/marcar) se guarda en backend vía `/feedback` con el `suggestion_id` real de cada sugerencia.
5. **Confianza visual**: cada salida muestra un score de confianza (0-100) en `ConfidenceBadge`.
6. **Prompt injection mitigation**: contenido del cliente tratado como no confiable; PII detectada client-side (marca) y redacción autoritativa vía `/v1/pii/redact`.
7. **Modo oscuro/clear**: compatible con ambos themes (la feature 004 solo tenía oscuro).

## Criterios de aceptación

- [ ] Panel lateral mantiene las 3 pestañas de 004 (Clasificar, Resumir, Chat) más nueva pestaña **Sugerencias**.
- [ ] Pestaña **Sugerencias** muestra 3 inputs con texto prellenado y botón "Usar sugerencia".
- [ ] Pestaña **Streaming** muestra textarea con output en tiempo real (tokens apareciendo).
- [ ] Cada token/sugerencia muestra score de confianza (0-100).
- [ ] Botón **Feedback** (Aceptar/Editar/Regenerar/Rechazar) guarda registro en backend.
- [ ] Filtro PII: textos con datos sensibles son marcados y opcionalmente masked antes del envío.
- [ ] `pnpm build`, `pnpm lint`, `pnpm typecheck` en verde.
- [ ] Sin `dangerouslySetInnerHTML`; todo renderizado como texto estructurado.
- [ ] a11y: labels aria en todos los inputs, contraste AA, focus management, keyboard navigation entre pestañas.

## Fuera de alcance

- Entrenamiento de modelo propio → backend externo.
- Integración con modelos locales o privados.
- Almacenamiento permanente de conversaciones (solo en sesión actual).
- Modelos de lenguaje con clasificación de seguridad propia.

## Datos de prueba

- Usuario con rol agent que tiene un ticket abierto en la bandeja.
- Verificar que las sugerencias aparecen basadas en el asunto y descripción del ticket.
- Streaming: tokens deben aparecer gradualmente sin bloquear la UI.
- Feedback: registrarse en tabla `llm_feedback` al interactuar.

(End of file - 51 lines)