@theme {
  --color-bark-950: #101613;
  --color-bark-900: #161F1A;
  --color-bark-800: #1E2923;
  --color-bark-700: #29342D;
  --color-bark-300: #97A29B;
  --color-cream: #EFEAE1;
  --color-caramel-300: #E5BC90;
  --color-caramel-400: #DAA97A;
  --color-caramel-500: #D19A66;
  --color-caramel-600: #BC8450;

  /* Bordes */
  --color-border: #2C3831;

  /* Estados de ticket */
  --color-status-open: #6EA8D8;
  --color-status-pending: #E0B46C;
  --color-status-waiting: #8B98A5;
  --color-status-solved: #7FBF8A;
  --color-status-closed: #6E7A76;

  /* Prioridad */
  --color-priority-urgent: #E05C5C;
  --color-priority-high: #D97736;
  --color-priority-medium: #E0B46C;
  --color-priority-low: #8B98A5;

  /* SLA */
  --color-sla-ok: #7FBF8A;
  --color-sla-at-risk: #E0B46C;
  --color-sla-breached: #E05C5C;

  /* Riesgo / seguridad */
  --color-risk-pii: #D97736;
  --color-risk-injection: #D05C8C;
  --color-risk-low-confidence: #E0B46C;
  --color-risk-high-confidence: #7FBF8A;
  --color-llm: #9D8DF1;

  /* Contenido de conversación */
  --color-content-customer-bg: #1C2421;
  --color-content-agent-bg: #243039;
  --color-content-note-bg: #2B2516;
  --color-content-llm-bg: #241F33;
  --color-content-llm-border: #9D8DF1;
  --color-content-approved: #7FBF8A;
}

## Roles base (tema oscuro)

Rol,HEX,Uso en la imagen
Fondo de página,#161F1A,Background general
Fondo de cards,#1E2923,Tarjetas y paneles
Superficie elevada,#29342D,"Tiles de iconos, hovers"
Bordes,#2C3831,Separadores y bordes de cards
Texto principal,#EFEAE1,Títulos y números
Texto secundario,#97A29B,Subtítulos y labels
Acento,#D19A66,"Botón ""Ver bandeja"", barras, badges"
Acento hover,#DAA97A,Estados hover

## Colores semánticos

Estos tokens se usan en componentes de negocio (badges, indicadores, paneles). Son coherentes con el tema oscuro: fondos de burl/bark, acentos caramelo y semánticos con contraste AA sobre `bark-800`/`bark-900`.

### Estados de ticket (spec §6.3)

| Token                | Valor      | Uso                                  |
|----------------------|------------|--------------------------------------|
| `--color-status-open`| `#6EA8D8`  | Estado abierto (azul)                |
| `--color-status-pending` | `#E0B46C` | Estado pendiente (ámbar)           |
| `--color-status-waiting` | `#8B98A5` | Esperando cliente (gris azulado)   |
| `--color-status-solved`  | `#7FBF8A` | Resuelto (verde)                   |
| `--color-status-closed`  | `#6E7A76` | Cerrado (gris)                     |

### Prioridad

| Token                    | Valor      | Uso                        |
|--------------------------|------------|----------------------------|
| `--color-priority-urgent`| `#E05C5C`  | Urgente (rojo)             |
| `--color-priority-high`  | `#D97736`  | Alta (naranja)             |
| `--color-priority-medium`| `#E0B46C`  | Media (ámbar)              |
| `--color-priority-low`   | `#8B98A5`  | Baja (gris/azulado)        |

### SLA

| Token              | Valor      | Uso                  |
|--------------------|------------|----------------------|
| `--color-sla-ok`       | `#7FBF8A`  | En tiempo (verde)    |
| `--color-sla-at-risk`  | `#E0B46C`  | En riesgo (ámbar)    |
| `--color-sla-breached` | `#E05C5C`  | Vencido (rojo)       |

### Riesgo / seguridad / LLM

| Token                       | Valor      | Uso                                          |
|-----------------------------|------------|----------------------------------------------|
| `--color-risk-pii`          | `#D97736`  | PII detectada (naranja, con ícono candado)   |
| `--color-risk-injection`    | `#D05C8C`  | Prompt injection sospechada (magenta)        |
| `--color-risk-low-confidence`  | `#E0B46C` | Confianza baja (ámbar)                       |
| `--color-risk-high-confidence` | `#7FBF8A` | Confianza alta (verde suave)                 |
| `--color-llm`               | `#9D8DF1`  | Identidad LLM (violeta/índigo suave)         |

### Contenido de conversación

| Token                        | Valor      | Uso                                              |
|------------------------------|------------|--------------------------------------------------|
| `--color-content-customer-bg`| `#1C2421`  | Fondo mensaje de cliente (neutro, label "Cliente")|
| `--color-content-agent-bg`   | `#243039`  | Fondo mensaje de agente (azul/gris claro)         |
| `--color-content-note-bg`    | `#2B2516`  | Fondo nota interna (ámbar muy suave, label "Interno")|
| `--color-content-llm-bg`     | `#241F33`  | Fondo sugerencia LLM (violeta tenue, label "Borrador LLM")|
| `--color-content-llm-border` | `#9D8DF1`  | Borde sugerencia LLM                              |
| `--color-content-approved`   | `#7FBF8A`  | Badge respuesta aprobada/enviada (verde)          |
