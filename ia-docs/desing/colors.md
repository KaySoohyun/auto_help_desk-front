@theme {
  /* Valores reales de src/styles/themes.css (2026-09-01) */
  --color-bark-950: #101613;
  --color-bark-900: #161f1a;
  --color-bark-800: #1e2923;
  --color-bark-700: #27352d;
  --color-bark-300: #8fa89b;
  --color-cream: #38bdf8;        /* OJO: en el tema real este token se usa como acento LLM (sky azul) */
  --color-caramel-300: #ebb07a;
  --color-caramel-400: #e0a977;
  --color-caramel-500: #d19a66;
  --color-caramel-600: #bd8755;
  --color-mint-300: #6bc99c;
  --color-mint-400: #52b788;
  --color-mint-500: #4ead87;

  /* Bordes */
  --color-border: #2e3d34;

  /* Estados de ticket */
  --color-status-open: #6ea8d8;
  --color-status-pending: #e0b46c;
  --color-status-waiting: #8fa89b;
  --color-status-solved: #52b788;
  --color-status-closed: #6e7a76;

  /* Prioridad */
  --color-priority-urgent: #e05c5c;
  --color-priority-high: #d97736;
  --color-priority-medium: #e0b46c;
  --color-priority-low: #8fa89b;

  /* SLA */
  --color-sla-ok: #52b788;
  --color-sla-at-risk: #e0b46c;
  --color-sla-breached: #e05c5c;

  /* Riesgo / seguridad */
  --color-risk-pii: #d97736;
  --color-risk-injection: #d05c8c;
  --color-risk-low-confidence: #e0b46c;
  --color-risk-high-confidence: #52b788;
  --color-llm: #38bdf8;

  /* Contenido de conversación */
  --color-content-customer-bg: #1c2421;
  --color-content-agent-bg: #27352d;
  --color-content-note-bg: #2b2516;
  --color-content-llm-bg: #182a38;
  --color-content-llm-border: #38bdf8;
  --color-content-llm-text: #38bdf8;
  --color-content-approved: #52b788;
}

## Roles base (tema oscuro)

Rol,HEX,Uso en la imagen
Fondo de página,#161f1a,Background general
Fondo de cards,#1e2923,Tarjetas y paneles
Superficie elevada,#27352d,Tiles de iconos, hovers
Bordes,#2e3d34,Separadores y bordes de cards
Texto principal — `foreground` (paleta de shadcn), no `cream` (ocupado por el acento LLM)
Texto secundario,#8fa89b,Subtítulos y labels
Acento,#d19a66,Botón "Ver bandeja", barras, badges
Acento hover,#e0a977,Estados hover
Acento LLM,#38bdf8,Bordas, texto y badges de LLM / asistente

## Colores semánticos

Estos tokens se usan en componentes de negocio (badges, indicadores, paneles). Son coherentes con el tema oscuro: fondos de bark, acentos caramelo y semánticos con contraste AA sobre `bark-800`/`bark-900`.

### Estados de ticket

| Token                | Valor      | Uso                                  |
|----------------------|------------|--------------------------------------|
| `--color-status-open`| `#6ea8d8`  | Estado abierto (azul)                |
| `--color-status-pending` | `#e0b46c` | Estado pendiente (ámbar)           |
| `--color-status-waiting` | `#8fa89b` | Esperando cliente (gris verdoso)   |
| `--color-status-solved`  | `#52b788` | Resuelto (verde)                   |
| `--color-status-closed`  | `#6e7a76` | Cerrado (gris)                     |

> Nota: los estados vigentes del dominio son `open|in_progress|on_hold|closed`; los tokens `pending/waiting/solved` persisten en el tema para badges heredados.

### Prioridad

| Token                    | Valor      | Uso                        |
|--------------------------|------------|----------------------------|
| `--color-priority-urgent`| `#e05c5c`  | Urgente (rojo)             |
| `--color-priority-high`  | `#d97736`  | Alta (naranja)             |
| `--color-priority-medium`| `#e0b46c`  | Media (ámbar)              |
| `--color-priority-low`   | `#8fa89b`  | Baja (gris verdoso)        |

### SLA

| Token              | Valor      | Uso                  |
|--------------------|------------|----------------------|
| `--color-sla-ok`       | `#52b788`  | En tiempo (verde)    |
| `--color-sla-at-risk`  | `#e0b46c`  | En riesgo (ámbar)    |
| `--color-sla-breached` | `#e05c5c`  | Vencido (rojo)       |

### Riesgo / seguridad / LLM

| Token                       | Valor      | Uso                                          |
|-----------------------------|------------|----------------------------------------------|
| `--color-risk-pii`          | `#d97736`  | PII detectada (naranja, con ícono candado)   |
| `--color-risk-injection`    | `#d05c8c`  | Prompt injection sospechada (magenta)        |
| `--color-risk-low-confidence`  | `#e0b46c` | Confianza baja (ámbar)                       |
| `--color-risk-high-confidence` | `#52b788` | Confianza alta (verde suave)                 |
| `--color-llm`               | `#38bdf8`  | Identidad LLM (azul sky)                     |

### Contenido de conversación

| Token                        | Valor      | Uso                                              |
|------------------------------|------------|--------------------------------------------------|
| `--color-content-customer-bg`| `#1c2421`  | Fondo mensaje de cliente (label "Cliente")        |
| `--color-content-agent-bg`   | `#27352d`  | Fondo mensaje de agente                           |
| `--color-content-note-bg`    | `#2b2516`  | Fondo nota interna (label "Interno")              |
| `--color-content-llm-bg`     | `#182a38`  | Fondo sugerencia LLM (label "Borrador LLM")       |
| `--color-content-llm-border` | `#38bdf8`  | Borde sugerencia LLM                              |
| `--color-content-approved`   | `#52b788`  | Badge respuesta aprobada/enviada (verde)          |