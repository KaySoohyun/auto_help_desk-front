# 005 · Panel LLM avanzado

**Estado:** propuesta

## Qué hace

Extiende el panel LLM base (004) con capacidades de streaming en tiempo real, sugerencias automáticas en el composer de tickets, y controles de aceptar/editar/regenerar/rechazar respuestas de la IA. Incluye indicadores de confianza y bloques de seguridad contra prompt injection.

## Por qué

El panel básico requiere que el usuario envíe manualmente cada mensaje. Las sugerencias automáticas y el streaming reducen el tiempo de triaje y mejoran la experiencia del agente, manteniendo el control humano en el loop con disclaimers y opciones de regeneración.

## Contexto real del backend (contratos de `ia-docs/backend/api.md`)

- `POST /v1/llm/stream` → streaming SSE (Server-Sent Events) con progreso en tiempo real.
- `POST /v1/llm/suggest` → recibe contexto de ticket, devuelve sugerencias de próxima acción con scores.
- `POST /v1/llm/feedback` → registra feedback del usuario (aceptar/editar/rechazar/regenerar) para mejorar el modelo.
- Todos los endpoints requieren `Authorization: Bearer <token>` y validan tenant.
- Errores: 401 token inválido/expired, 429 rate limit, 400 texto inválido.

## Decisiones de adaptación (a aprobar)

1. **Streaming SSE**: el frontend conecta a `POST /api/bff/llm/stream` y muestra tokens a medida que llegan, con cancelación manual.
2. **Sugerencias predictivas**: el panel muestra 3 sugerencias debajo del input basadas en el contexto del ticket actual (categoría, prioridad, próximos pasos).
3. **Historial de feedback**: cada interacción (aceptar/editar/rechazar/regenerar) se guarda en `llm_feedback` tabla con usuario, ticket, acción y timestamp.
4. **Confianza visual**: cada token/sugerencia muestra un score de confianza (0-100) calculado por el backend.
5. **Prompt injection mitigation**: el texto enviado al LLM pasa por un filtro básico que bloquea patrones sospechosos y marca PII antes del envío.
6. **Modo oscuro/clear**: compatible con ambos themes (la feature 004 solo tenía oscuro).

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