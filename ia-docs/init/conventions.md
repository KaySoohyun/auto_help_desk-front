# Convenciones del proyecto

## Regla de documentación

Cada cambio significativo debe documentarse en `ia-docs/init/`:
- Nuevas funciones o componentes → actualizar `arquitecture.md`
- Cambios de convención → actualizar este archivo
- Bugs corregidos → agregar nota en `changes.md`

## Código

- **Idioma**: todo el contenido visible al usuario en español (argentino).
- **Tipos**: las entidades se definen en `src/types/` (auth, ticket, knowledge, audit, llm). Sin `any` salvo justificación explícita.
- **Estilos**: Tailwind CSS utility-first. No hay CSS modules ni styled-components.
- **Componentes**: shadcn/ui en `src/components/ui/`, componentes de negocio en `src/components/features/<dominio>/`, layout en `src/components/layout/`.
- **Formularios**: React Hook Form + Zod. Los schemas de validación viven en `src/lib/validation/` y se comparten entre cliente y BFF.
- **Server state**: TanStack Query. Query keys siempre con tenant: `['tenant', tenantSlug, ...]`.
- **Estado UI**: Zustand en `src/stores/` (sesión, tenant activo, preferencias, selección de tickets).
- **Archivos de configuración**: en la raíz del proyecto (`next.config.ts`, `components.json`, `tsconfig.json`, etc.).

## Server vs Client

- **Server Components** para: guards de sesión/tenant, layouts, metadata, vistas de solo lectura, carga inicial de permisos.
- **Client Components** para: tablas, filtros, selección múltiple, detalle de ticket, conversation thread, composer, panel LLM, formularios, audit tables.
- Regla práctica: lectura estática o control de acceso → RSC; interacción frecuente, optimistic UI, streaming o formularios → Client.
- Los guards de servidor no reemplazan la autorización del backend: la UI oculta, el backend decide.

## BFF y red

- El navegador solo llama a `/api/bff/...` (Route Handlers). Nunca a FastAPI directamente.
- Errores del BFF con formato tipado: `{ error: { code, message, details, correlationId } }`.
- Mutations sin retry automático; GET con retry limitado; 401 dispara refresh en el BFF; 403/404 no se reintentan.
- `AbortController` para cancelar queries al cambiar filtros y para detener streaming LLM.
- Filtros y paginación viven en la URL (search params), parseados con Zod.

## Sesión y tokens

- Access y refresh token en cookies HttpOnly. Nunca en `localStorage` ni en la URL.
- El cliente solo recibe datos públicos de sesión (vía `/api/bff/me`).
- Cambio de tenant: resetear QueryClient y estado de sesión para no filtrar datos entre tenants.

## Seguridad y PII

- PII enmascarada por defecto; revelado solo con permiso, motivo opcional y registro de auditoría.
- Copia de campos sensibles: ofrecer copia redactada, desalentar copia directa.
- Sin `dangerouslySetInnerHTML` salvo necesidad explícita y sanitizada.
- Contenido del cliente siempre tratado como no confiable (prevenir XSS y prompt injection).
- No exponer secretos ni tokens en logs ni en respuestas.

## LLM responsable

- Toda sugerencia LLM es un borrador editable; nunca se envía automáticamente.
- Mostrar confianza, fuentes, riesgos y advertencias (bajo contexto, alucinación, PII, prompt injection).
- Si se sospecha prompt injection: warning visible, confianza baja y bloqueo de apply automático.
- Registrar auditoría de generación, aceptación, edición, rechazo, feedback y envío final.
- No ejecutar acciones basadas en la salida del LLM sin confirmación humana.

## Accesibilidad (a11y)

- Objetivo **WCAG 2.2 AA** en toda la UI operativa (contraste AA mínimo, navegación por teclado completa, focus visible).
- Skip-link "Saltar al contenido" al inicio de `AppShell`; `<main>` con `id="main-content"` y `tabIndex={-1}`.
- `aria-label` en botones interactivos (incluidos los icon-only); `aria-pressed` en toggles.
- `:focus-visible` con outline visible en todos los elementos interactivos.
- Jerarquía de headings correcta (h1 → h2 → h3).
- Estados de error que no dependan solo del color.
- Formularios con labels y mensajes de error asociados (`aria-describedby`).
- Confirmaciones destructivas con foco gestionado.
- Soporte para `prefers-reduced-motion`.

## Animaciones

- Animaciones sutiles, de rendimiento y con respeto estricto a `prefers-reduced-motion: reduce`.
- Estados de carga: skeletons por zona en lugar de spinners genéricos.
- Sin animaciones que dificulten la lectura en UI operativa.

## Paleta y tipografía

- Usar tokens de Tailwind (`text-primary`, `bg-card`, `border-border`, `text-muted-foreground`) en lugar de valores hardcodeados.
- Tokens de color y paleta semántica definidos en `ia-docs/desing/colors.md`.
- Tipografía: seguir lo definido en la arquitectura / design tokens (fuente de sistema para la consola operativa).

## Git

- Commits descriptivos en inglés.
- No commitear `node_modules/` ni archivos de build.
- No commitear `.env*` ni secretos.

## Estructura de componentes

- Componentes de negocio: `src/components/features/<dominio>/`.
- Componentes de UI reutilizables: `src/components/ui/` (shadcn/ui).
- Layout y shell: `src/components/layout/`.
- Los componentes de shadcn se importan con alias `@/components/ui/`.
- Los hooks custom van en `src/hooks/<dominio>/`.
- Lógica de dominio en `src/lib/`; stores en `src/stores/`.
- Cada componente de negocio en un archivo aparte, con nombre PascalCase.
