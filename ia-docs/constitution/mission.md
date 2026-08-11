# Misión

_Define la razón de ser del proyecto. Es la referencia que decide si una feature "encaja" o no._

## Qué construimos

Consola operativa de soporte **SaaS multi-tenant** donde los agentes resuelven tickets con base de conocimiento y asistencia LLM responsable, con seguridad, PII, auditoría y prevención de fuga de información como requisitos de primer orden.

1. **Gestión de tickets** — bandeja, filtros, detalle, respuestas, notas internas, SLA y asignación, con scoping por tenant y control de permisos por rol.
2. **Asistente LLM responsable** — clasifica, resume y sugiere respuestas siempre como borrador editable, con confianza, fuentes, riesgos y auditoría; nunca actúa sin revisión humana.
3. **Base de conocimiento** — artículos con draft/published/archived, categorías, versionado y uso desde tickets y LLM.
4. **Administración y auditoría** — usuarios, roles, equipos, SLA, configuración del tenant y trazabilidad de acciones humanas y del LLM.

## Para quién

- **Agentes de soporte** — resuelven tickets rápido y con asistencia segura.
- **Supervisores** — monitorean SLA, asignan y priorizan, gestionan KB.
- **Administradores de tenant** — configuran usuarios, permisos, SLA, canales y políticas de privacidad/LLM.
- **Auditores** — revisan acciones y eventos sin poder mutar datos.
- **Administradores de plataforma** — gestionan tenants y visión global.

## Principios

- **El humano manda, el LLM sugiere** — ninguna sugerencia se envía o ejecuta sin revisión humana; todo es editable y auditable.
- **Seguridad y PII primero** — PII enmascarada por defecto, revelado con permiso y auditoría, contenido del cliente siempre no confiable.
- **El backend es la autoridad** — FastAPI valida tenant, permisos y reglas; el frontend solo presenta lo autorizado.
- **Multi-tenant real** — URL scoping por tenant, permisos validados por tenant, cero fuga de datos entre tenants.
- **Operativo y desktop-first** — herramienta de trabajo diario, densa pero legible, con estados siempre visibles.

## Qué NO es

- No es un agente autónomo ni un sistema de respuestas automáticas.
- No es un portal público de conocimiento ni un CMS abierto.
- No es una app mobile-first ni una landing decorativa.
- No decide permisos ni reglas de negocio (eso vive en el backend).
- No almacena datos ni tokens sensibles en el cliente.
