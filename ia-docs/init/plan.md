Roadmap de implementación por fases y etapas

## Fase 1 — MVP funcional

### Objetivo
Construir la base segura y operativa del producto: auth, tenants, tickets, bandeja, detalle y respuestas básicas.

### Etapa 1.1 — Fundaciones técnicas
Incluye:
- Next.js + TS + Tailwind + shadcn/ui.
- ESLint + Prettier.
- Estructura de carpetas.
- BFF base.
- Middleware de sesión.
- Login.
- MFA opcional.
- Recuperación de contraseña.
- Selección de tenant.
- AppShell.
- TenantSwitcher.
- Session store.
- Manejo de errores base.

Queda afuera:
- LLM.
- Knowledge base completa.
- Auditoría avanzada.

### Etapa 1.2 — Bandeja y detalle de tickets
Incluye:
- Ticket list.
- Filtros.
- Búsqueda.
- Paginación.
- Selección múltiple.
- Estados, prioridad, SLA visual.
- Detalle de ticket.
- Conversation thread.
- Metadata.
- Adjuntos en solo vista.
- Notas internas.
- Respuestas públicas.
- Historia de eventos básica.

Queda afuera:
- Bulk actions avanzadas.
- Optimistic updates complejas.
- LLM.

### Etapa 1.3 — Dashboard básico
Incluye:
- KPIs simples.
- Tickets asignados a mí.
- Tickets abiertos.
- Sin asignar.
- En riesgo SLA.

Queda afuera:
- Alertas LLM.
- Reporting avanzado.

### Criterios de aceptación Fase 1
- Usuario puede loguearse y elegir tenant.
- Las rutas están protegidas.
- La URL scoping por tenant funciona.
- Un agente puede abrir tickets y responder.
- Los filtros persisten en URL.
- Hay estados de loading, error y empty.
- No hay tokens expuestos en JS.
- Backend valida permisos y la UI los refleja.

---

## Fase 2 — Asistente LLM

### Objetivo
Introducir asistencia LLM segura, auditable y editable dentro del ticket.

### Etapa 2.1 — Panel LLM base
Incluye:
- Panel lateral.
- Acciones de clasificar y resumir.
- Estados de carga y error.
- Disclaimer humano.

### Etapa 2.2 — Sugerencias de respuesta
Incluye:
- Sugerir respuesta.
- Streaming si backend lo soporta.
- Inserción en composer como borrador.
- Edición completa.
- Aceptar y editar.
- Rechazar.
- Regenerar.

### Etapa 2.3 — Seguridad y confianza
Incluye:
- ConfidenceBadge.
- Riesgos.
- PII detectada.
- Prompt injection warning.
- Bloqueo de apply automático.
- Mensajes de bajo contexto.

### Etapa 2.4 — Feedback y auditoría
Incluye:
- Útil/no útil.
- Registro de aceptación/rechazo.
- Registro de sugerencia usada en respuesta final.
- Límites de uso visibles.

Queda afuera en esta fase:
- Respuestas automáticas.
- Agentes autónomos.
- Evaluación offline de modelos.
- Fine-tuning UI.

### Criterios de aceptación Fase 2
- Ninguna sugerencia se envía automáticamente.
- Toda sugerencia es editable.
- Se muestra confianza y fuentes.
- Hay warning de prompt injection si aplica.
- El agente puede dar feedback.
- Auditoría registra uso LLM.
- El panel maneja error, límite y bajo contexto.

---

## Fase 3 — Base de conocimiento

### Objetivo
Permitir gestión de artículos y conectar conocimiento con tickets y LLM.

### Etapa 3.1 — Listado y búsqueda
Incluye:
- Artículos.
- Categorías.
- Tags.
- Búsqueda.
- Estados.

### Etapa 3.2 — Editor y versionado
Incluye:
- Crear/editar.
- Draft/published/archived.
- Version history.
- Confirmaciones para acciones destructivas.

### Etapa 3.3 — Permisos y workflow
Incluye:
- Permisos por rol.
- Publicación supervisada.
- Restricciones por tenant.

### Etapa 3.4 — Integración con tickets y LLM
Incluye:
- Artículos recomendados en panel LLM.
- Insertar referencia en respuesta.
- Métricas básicas de uso.

Queda afuera:
- Portal público externo.
- Búsqueda semántica avanzada si backend no la soporta.
- Comentarios colaborativos complejos.

### Criterios de aceptación Fase 3
- Admin/supervisor puede publicar artículos.
- Agente puede buscar y usar artículos.
- Editor soporta draft/published/archived.
- Versionado básico funciona.
- LLM puede citar artículos si backend lo devuelve.
- Permisos se respetan.

---

## Fase 4 — Administración y auditoría

### Objetivo
Completar gestión de tenant, configuración y trazabilidad.

### Etapa 4.1 — Usuarios, equipos y roles
Incluye:
- Gestión de usuarios.
- Invitaciones.
- Equipos.
- Roles.
- Matriz de permisos visible.

### Etapa 4.2 — Configuración operativa
Incluye:
- SLA.
- Canales.
- Categorías.
- Tags.
- Plantillas.

### Etapa 4.3 — Auditoría
Incluye:
- Eventos de usuario.
- Eventos LLM.
- Cambios de estado/asignación.
- Acciones sobre PII.
- Exportaciones.
- Aprobación/rechazo de sugerencias.

### Etapa 4.4 — Privacidad, retención y LLM
Incluye:
- Políticas de retención.
- Preferencias de privacidad.
- Límites LLM.
- Configuración de redacción de PII.

Queda afuera:
- Billing.
- Reporting ejecutivo avanzado.
- Jerarquías organizacionales complejas.

### Criterios de aceptación Fase 4
- Tenant admin puede gestionar usuarios y configuración.
- Auditor puede leer eventos sin editar.
- Cambios sensibles quedan auditados.
- Revelado de PII queda registrado.
- Configuración LLM aplica límites visibles.
- UI refleja permisos por rol.

---

## Fase 5 — Optimización y hardening

### Objetivo
Mejorar rendimiento, seguridad, accesibilidad y estabilidad operativa.

### Etapa 5.1 — Performance
Incluye:
- Optimización de queries.
- Virtualización si hay tablas muy grandes.
- Debounce de búsqueda.
- Suspense y streaming UI.
- Reducción de bundle.
- prefetch inteligente.

### Etapa 5.2 — Security hardening
Incluye:
- CSP.
- CSRF hardening.
- Revisión de headers.
- Validación extrema de entradas.
- Pruebas de autorización.
- Manejo robusto de 401/403.

### Etapa 5.3 — Accesibilidad y UX operativa
Incluye:
- WCAG AA.
- Keyboard navigation.
- Focus management.
- Estados de error más claros.
- Densidad configurable.

### Etapa 5.4 — Observabilidad y calidad
Incluye:
- Correlation IDs.
- Error tracking.
- Métricas de uso LLM.
- E2E tests críticos.
- Load testing si aplica.

Queda afuera:
- Nuevas features funcionales grandes.

### Criterios de aceptación Fase 5
- Cargas principales son fluidas.
- No hay regresiones de seguridad.
- Flujos críticos son accesibles.
- Errores son trazables.
- El sistema se comporta bien bajo uso operativo real.

---

# 14. Decisiones abiertas

Antes de implementar, conviene definir estas preguntas:

## Autenticación e identidad
1. ¿Se usará login propio, OIDC, SAML o ambos?
2. ¿MFA será obligatorio para algunos roles?
3. ¿Un usuario puede pertenecer a múltiples tenants simultáneamente?
4. ¿Habrá impersonación por parte de platform admin?
5. ¿Cómo se manejará la expiración de sesión en formularios no enviados?

## Tenancy y autorización
6. ¿El backend expone permisos como RBAC simple o ABAC más fino?
7. ¿Los agentes ven todos los tickets del tenant o solo los asignados a su equipo?
8. ¿Qué acciones se permiten por defecto a supervisores?
9. ¿Puede haber roles custom por tenant?
10. ¿El cambio de tenant debe limpiar todo el estado local y queries?

## Tickets y operación
11. ¿Qué canales existirán: email, chat, WhatsApp, API?
12. ¿Se requiere realtime para nuevos mensajes y actualizaciones?
13. ¿La bandeja debe soportar vistas guardadas?
14. ¿Los adjuntos requieren antivirus/escaneo?
15. ¿Se permiten respuestas públicas y notas internas con adjuntos?
16. ¿Qué SLA calendars y business hours se deben contemplar?

## PII y privacidad
17. ¿Qué categorías de PII deben detectarse?
18. ¿La detección y redacción ocurre en backend o también en frontend?
19. ¿Quién puede revelar PII?
20. ¿Se requiere motivo obligatorio para revelar PII?
21. ¿Las exportaciones pueden incluir PII?
22. ¿Qué política de retención aplica a mensajes y adjuntos?

## LLM
23. ¿Qué proveedor LLM se usará?
24. ¿El backend enviará PII redactada al modelo?
25. ¿Se mostrarán costos/tokens al agente?
26. ¿Habrá límites por tenant, usuario o día?
27. ¿El modelo puede usar datos para entrenamiento?
28. ¿Se requiere streaming real o respuestas completas?
29. ¿Qué confianza mínima se requiere para sugerir respuesta?
30. ¿Se bloqueará completamente la sugerencia si hay alta sospecha de prompt injection?

## Knowledge base
31. ¿La búsqueda será simple, full-text o semántica?
32. ¿Habrá artículos públicos y privados?
33. ¿Se requieren múltiples idiomas?
34. ¿El versionado debe permitir rollback completo?
35. ¿Las métricas de uso serán por ticket o por agente?

## Auditoría
36. ¿Cuánto tiempo se retienen los logs?
37. ¿El auditor puede exportar?
38. ¿Qué campos de evento deben mostrarse siempre redactados?
39. ¿Se requiere inmutabilidad criptográfica de auditoría?

## UX y plataforma
40. ¿Habrá soporte multi-idioma en UI desde el inicio?
41. ¿El producto debe funcionar bien solo en desktop o también mobile?
42. ¿Se quiere modo oscuro desde MVP?
43. ¿Se requiere command palette / búsqueda global?
44. ¿Se necesitan notificaciones in-app?

## Performance y arquitectura
45. ¿El backend soporta ETags o paginación cursor?
46. ¿Se usará CDN para assets?
47. ¿Se requiere observabilidad frontend con métricas de Core Web Vitals?
48. ¿Cuál es el volumen esperado de tickets por tenant?

---

# 15. Recomendación final para empezar a construir

Para que un agente de código o un equipo pueda empezar sin ambigüedades, recomiendo este orden práctico:

1. **Definir contratos de API y permisos**
   - Auth, tenants, tickets, LLM, KB, audit.

2. **Construir BFF y sesión**
   - Login, refresh, logout, cookies HttpOnly.

3. **Implementar tenant selection y app shell**
   - URL scoping, guards, navegación.

4. **Construir bandeja y detalle de tickets**
   - Sin LLM todavía.
   - Con estados de carga, vacío, error y permisos.

5. **Agregar acciones básicas**
   - Reply, nota interna, cambio de estado, asignación.

6. **Incorporar panel LLM**
   - Primero classify/summary, luego suggested reply.

7. **Sumar knowledge base**
   - Listado, editor, versionado, permisos.

8. **Cerrar administración y auditoría**
   - Usuarios, roles, settings, logs.

9. **Hardening final**
   - Seguridad, performance, accesibilidad, observabilidad.
