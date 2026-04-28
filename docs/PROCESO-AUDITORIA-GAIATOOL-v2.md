# Proceso de auditoría de sostenibilidad con GaiaTool v2.0

> Documento basado en el TFG de Ángela Poyatos Gómez (enero 2026, UMU) y en el estado **actual** del repositorio (sin las extensiones CSRD/ESRS en curso). Describe paso a paso cómo tres roles colaboran para llevar una auditoría de sostenibilidad software "de cero a informe PDF" usando la matriz de Saaty (AHP). Al final se plantea un caso ficticio completo.

---

## 1. Conceptos previos

GaiaTool v2.0 mide la **sostenibilidad organizacional a partir de procesos de negocio**. La idea es:

1. Se definen **indicadores** cuantitativos (ambientales, sociales, gubernamentales, técnicos…).
2. Se agrupan en **procesos de negocio** (producción de software, RRHH, etc.), asociando cada indicador a un **factor crítico de éxito** de la organización.
3. En una **auditoría** concreta, un auditor evaluador introduce el **valor real** y el **valor ideal** de cada indicador y rellena la **matriz de Saaty** (comparación por pares) para cada proceso.
4. El sistema calcula un **índice de sostenibilidad por proceso** y un **coeficiente global** para la organización.
5. Se emite un **informe PDF** y se habilitan **estadísticas** y **comparaciones** con auditorías previas.

### 1.1. Entidades del dominio

| Entidad | Atributos clave |
|---|---|
| **Usuario** | usuario, email, contraseña, nombre, apellidos, `rol` ∈ {Administrador, Auditor jefe, Auditor evaluador} |
| **Organización** | nombre, descripción, país, sector, web, rango empleados, **objetivos**, **factores críticos de éxito** |
| **Indicador** | nombre, **dimensión** (ambiental/social/…), **fórmula**, **objetivo** ∈ {Minimizar, Maximizar}, medida, frecuencia |
| **Proceso de negocio** | nombre, **tipo** ∈ {Estratégico, Clave, Soporte}, descripción, **responsable** (Usuario). Mín. 3 indicadores y cada uno atado a un factor crítico. |
| **Auditoría** | nombre, fecha inicio/fin, frecuencia, estado, coeficiente, `auditor` (evaluador), `manager` (creador), organización. `auditor ≠ manager`. |
| **CalculoValorIndicador** | valor real, valor ideal, valor normalizado, peso (por auditoría × proceso × indicador) |
| **CalculoValorProceso** | índice de sostenibilidad del proceso en esa auditoría |
| **CalculoValorElementoMatriz** | celdas de la matriz de Saaty (auditoría × proceso × indicador_fila × indicador_col) |

### 1.2. Estados de una auditoría

| Estado | Color | Significado |
|---|---|---|
| No iniciada | Blanco | La fecha de inicio aún no ha llegado |
| Pendiente de evaluar | Rojo | Está en plazo y el auditor evaluador debe evaluarla |
| Evaluada | Azul | El evaluador ha completado la matriz y los valores |
| No evaluada | Naranja | Se alcanzó la fecha fin sin evaluación |
| Cerrada | Verde | Cerrada por tiempo o manualmente por el creador; lista para informe |

---

## 2. Roles del sistema

El TFG define tres roles. Cuando una acción la puede hacer tanto el Administrador como el Auditor jefe, se habla de **"usuario con permisos avanzados"**.

### 2.1. Administrador
- Control total sobre el sistema.
- **Única capacidad exclusiva**: asignar/cambiar roles a otros usuarios (RF-5, CU-7).
- Puede hacer todo excepto **evaluar** una auditoría (eso es exclusivo del auditor evaluador).

### 2.2. Auditor jefe
- Mismos permisos que el administrador **salvo** la asignación de roles.
- Crea/modifica/elimina organizaciones, indicadores, procesos y auditorías.
- Crea auditorías y las asigna a un auditor evaluador.
- Cierra auditorías manualmente.
- Compara auditorías y consulta evolución histórica (5/10/25/50/100 auditorías).

### 2.3. Auditor evaluador
- Acceso **de lectura** a la mayor parte del sistema.
- **Única capacidad exclusiva**: realizar la evaluación de una auditoría que le haya sido asignada (CU-32, RF-18).
- Consulta las 10 últimas auditorías en evolución histórica.

> Nota: cualquier persona que se registre en la aplicación entra por defecto como **Auditor evaluador** (RF-1). El administrador debe promoverla si procede.

---

## 3. Flujo de una auditoría, fase a fase

El proceso global se estructura en **6 fases**. Para cada fase se indica **quién hace qué** y **en qué orden**.

```
  [0]Alta              [1]Setup              [2]Diseño            [3]Lanzar               [4]Evaluar          [5]Cierre
  usuarios  →   organización + indicadores  → procesos  →  crear auditoría → evaluación Saaty → informe + stats
  (Admin)        (Admin / Auditor jefe)     (A. jefe)     (A. jefe)           (A. evaluador)   (A. jefe/Admin)
```

### Fase 0 — Alta de usuarios y asignación de roles

**Responsable principal: Administrador**

1. Los futuros auditores se **registran** desde la pantalla pública (CU-1) indicando nombre, usuario, email y contraseña. Al registrarse entran como `Auditor evaluador`.
2. El Administrador accede a **Settings → Gestión de roles** (CU-7) y promueve a los usuarios que deban serlo a `Auditor jefe`.
3. (Opcional) Los usuarios pueden cambiar su contraseña (CU-6) o recuperarla por correo (CU-5).

Postcondición: existe al menos un Auditor jefe (para crear entidades) y un Auditor evaluador (para evaluar).

---

### Fase 1 — Setup: organización, factores críticos e indicadores

**Responsable principal: Auditor jefe** (también puede hacerlo el Administrador)

#### 1.1. Crear la organización a auditar (CU-8)
Desde *Organizations → New organization* se rellena:
- Nombre, descripción, país, sector, web, rango de empleados.
- **Objetivos estratégicos** (texto libre).
- **Factores críticos de éxito** (lista). Estos se utilizarán luego al construir los procesos: cada indicador de un proceso debe apuntar a uno de estos factores.

#### 1.2. Poblar el repositorio de indicadores
Dos vías (RF-8/9):
- **Manual** (CU-13): se crean uno a uno rellenando nombre, dimensión, fórmula, objetivo (Minimizar/Maximizar), unidad de medida y frecuencia.
- **Importación CSV/Excel** (CU-16): se sube un fichero con el catálogo completo. Útil cuando se reutiliza un repositorio normalizado.

> Los indicadores son **globales y reutilizables**: el mismo indicador puede formar parte de varios procesos de negocio en distintas organizaciones (RF-11).

Postcondición: la organización existe y hay **≥ 3 indicadores** en el repositorio (es el mínimo que requerirá cada proceso).

---

### Fase 2 — Diseño de procesos de negocio

**Responsable principal: Auditor jefe**

Por cada proceso relevante en la organización (CU-20):

1. *Business processes → New* → rellenar **nombre**, **tipo** (Estratégico / Clave / Soporte), **descripción** y **responsable** (debe ser un usuario del sistema).
2. El sistema muestra un formulario para **asociar indicadores** del repositorio al proceso (mínimo 3, restricción de integridad).
3. Se presenta otro formulario para **asignar a cada indicador uno de los factores críticos** de la organización. Esto es lo que contextualiza el indicador dentro del negocio.

Se repite para todos los procesos. Típicamente: un proceso Estratégico, varios Clave y los Soporte. En el TFG se usan cuatro procesos por defecto (Producción de Software, Comercialización de Software, Informatización y Gestión de Recursos Humanos).

---

### Fase 3 — Creación y lanzamiento de la auditoría

**Responsable principal: Auditor jefe (manager) o Administrador**

1. *Audits → New audit* (CU-25):
   - Nombre, descripción, fechas de **inicio y fin**, frecuencia (Diaria/Semanal/Mensual/Cuatrimestral/Anual).
   - **Organización** a auditar.
   - Selección de **procesos de negocio** a evaluar (mínimo 1).
   - **Auditor evaluador asignado**. Restricción: no puede ser la misma persona que el manager.
2. Al guardar, el sistema:
   - Deja la auditoría en estado `No iniciada` (blanco) hasta la fecha de inicio; cuando llega esa fecha pasa a `Pendiente de evaluar` (rojo).
   - **Envía correo** al auditor evaluador notificándole la asignación.
3. Mientras la fecha actual sea **anterior a la fecha de inicio**, el creador puede **modificar** la auditoría (CU-26). Si se **elimina** (CU-27), el sistema también avisa al evaluador por correo.

Pestañas de la vista de auditorías:
- **All audits**: listado general (todos los roles).
- **My audits / Created**: las que creó el usuario con permisos avanzados (CU-30).
- **Pending / Assigned**: las asignadas al auditor evaluador actual (CU-31).

---

### Fase 4 — Evaluación (corazón del sistema)

**Responsable único: Auditor evaluador**

Éste es el caso de uso central (CU-32, RF-18). El evaluador entra en *Pending audits*, pulsa "Evaluate" y el sistema le guía por **dos subformularios por cada proceso** de la auditoría:

#### 4.1. Valores reales e ideales
Para cada indicador del proceso, el evaluador introduce:
- **Valor real**: el dato observado en la organización para el periodo auditado.
- **Valor ideal**: el objetivo deseable/benchmark.

El sistema **normaliza** el valor teniendo en cuenta el objetivo (Minimizar → mejor cuanto menor; Maximizar → mejor cuanto mayor).

#### 4.2. Matriz de Saaty (AHP)
Por cada proceso se presenta una **matriz cuadrada n × n** con los indicadores del proceso en filas y columnas. El evaluador rellena la mitad superior con la **importancia relativa** de cada par de indicadores usando la escala de Saaty (1 = igual, 3 = algo más, 5 = más, 7 = mucho más, 9 = extremadamente más; 2,4,6,8 como intermedios). La mitad inferior se obtiene por reciprocidad.

A partir de esa matriz el motor calcula:
- Los **pesos** (vector propio dominante) de los indicadores dentro del proceso.
- El **índice de sostenibilidad del proceso** = Σ (valor normalizado × peso).

#### 4.3. Cierre de la evaluación
Cuando el evaluador confirma, la auditoría pasa a estado `Evaluada` (azul) y se almacenan:
- `CalculoValorIndicador` (real, ideal, normalizado, peso)
- `CalculoValorProceso` (índice por proceso)
- `CalculoValorElementoMatriz` (todas las celdas Saaty)
- `coeficiente` global de la auditoría (ya no admite nulo en este estado).

Si el evaluador **no completa** la evaluación antes de la fecha fin, la auditoría pasa a `No evaluada` (naranja).

---

### Fase 5 — Cierre, informe y explotación de resultados

**Responsables: Auditor jefe / Administrador (cierre) + cualquier usuario (consulta)**

#### 5.1. Cierre (CU-33)
El creador de la auditoría puede **cerrarla manualmente** (o se cierra automáticamente al llegar la fecha fin). Pasa a estado `Cerrada` (verde). Sólo a partir de aquí se pueden generar informe y estadísticas.

#### 5.2. Generación de informe PDF (CU-34, RF-21)
Cualquier usuario registrado puede ir a **Audits → Reports** y descargar el PDF con:
- Datos de la organización y de la auditoría.
- Detalle por proceso: indicadores, valores reales/ideales, matriz de Saaty, pesos, índice.
- Coeficiente global de sostenibilidad.

#### 5.3. Estadísticas (CU-35 a CU-38)
Sección *Statistics Management*:
- **Detalle de una auditoría**: dimensiones cubiertas, nº factores críticos, comparación de índices entre procesos.
- **Evolución de una organización**:
  - Auditor evaluador → últimas **10** auditorías (CU-36, RF-24).
  - Permisos avanzados → seleccionar entre **5, 10, 25, 50 o 100** (CU-37, RF-25).
- **Comparación de dos auditorías** (CU-38, RF-26): coeficiente, índice proceso a proceso y desglose de indicadores. Marca los indicadores `Active` (siguen existiendo) y los `Inactive` (borrados del repositorio).

---

## 4. Ejemplo ficticio completo: **"NEXUM Software S.L."**

Se ilustra el flujo de las fases 0 → 5 con una empresa inventada.

### 4.1. La organización

| Campo | Valor |
|---|---|
| Nombre | NEXUM Software S.L. |
| Sector | Desarrollo de software ERP para pymes |
| País | España |
| Web | https://nexum.example |
| Rango empleados | 101–250 (actualmente 142) |
| Objetivos | (O1) Reducir la huella energética del CPD un 30 % en 3 años. (O2) Alcanzar paridad de género en plantilla técnica para 2028. (O3) Entregar releases con <5 defectos/KLOC. |
| Factores críticos de éxito | FC1 — Eficiencia energética del CPD · FC2 — Calidad del producto software · FC3 — Retención y bienestar del talento · FC4 — Cumplimiento normativo y ético · FC5 — Eficiencia operativa comercial |

### 4.2. Usuarios

| Usuario | Rol | Motivo |
|---|---|---|
| `alicia.admin` | Administrador | Dueña del sistema, asigna roles |
| `bruno.jefe` | Auditor jefe | Crea entidades, lanza auditoría y la cierra |
| `carla.eval` | Auditor evaluador | Realizará la evaluación |
| `david.eval` | Auditor evaluador | Suplente / revisión cruzada |

### 4.3. Repositorio de indicadores importado

| # | Indicador | Dim. | Fórmula | Obj. | Medida | Frec. |
|---|---|---|---|---|---|---|
| I1 | Consumo eléctrico del CPD | Ambiental | kWh totales periodo | Minimizar | kWh | Mensual |
| I2 | PUE del CPD | Ambiental | Energía total / Energía TI | Minimizar | ratio | Mensual |
| I3 | % energía renovable | Ambiental | kWh renovables / kWh totales · 100 | Maximizar | % | Mensual |
| I4 | Densidad de defectos | Técnica | nº defectos / KLOC | Minimizar | def/KLOC | Mensual |
| I5 | Cobertura de tests | Técnica | Líneas cubiertas / totales · 100 | Maximizar | % | Semanal |
| I6 | Tiempo medio pipeline CI | Técnica | Σ duración builds / nº builds | Minimizar | min | Semanal |
| I7 | Rotación voluntaria | Social | Bajas voluntarias / plantilla media · 100 | Minimizar | % | Anual |
| I8 | Horas de formación/empleado | Social | Σ horas formación / plantilla | Maximizar | h | Anual |
| I9 | Brecha salarial de género | Social | (Sal. medio H − Sal. medio M) / Sal. medio H · 100 | Minimizar | % | Anual |
| I10 | % teletrabajo | Social | Días teletrabajo / días laborables · 100 | Maximizar | % | Mensual |
| I11 | Km comerciales recorridos | Ambiental | Σ km desplazamientos comerciales | Minimizar | km | Mensual |
| I12 | % contratos digitales | Gubern. | Contratos firma digital / total · 100 | Maximizar | % | Mensual |

### 4.4. Procesos de negocio diseñados

| Proceso | Tipo | Responsable | Indicadores (FC asociado) |
|---|---|---|---|
| **P1 — Producción de Software** | Clave | CTO | I4 (FC2), I5 (FC2), I6 (FC2), I1 (FC1) |
| **P2 — Gestión del CPD** | Soporte | Jefe de Infra | I1 (FC1), I2 (FC1), I3 (FC1) |
| **P3 — Gestión de RRHH** | Soporte | HR Manager | I7 (FC3), I8 (FC3), I9 (FC4), I10 (FC3) |
| **P4 — Comercialización** | Estratégico | Director Comercial | I11 (FC5), I12 (FC4), I6 (FC5) |

> Cumple las restricciones del modelo: cada proceso tiene ≥ 3 indicadores y cada indicador está ligado a un factor crítico de NEXUM.

### 4.5. Auditoría concreta

- **Nombre**: *NEXUM-Q1-2026*
- **Periodo**: 01-ene-2026 → 31-mar-2026, frecuencia Cuatrimestral.
- **Procesos incluidos**: P1, P2, P3, P4.
- **Manager (creador)**: `bruno.jefe`.
- **Auditor evaluador**: `carla.eval`.

### 4.6. Paso a paso con fechas reales

| Fecha | Actor | Acción en la herramienta |
|---|---|---|
| 15-dic-2025 | `alicia.admin` | Promueve a `bruno.jefe` a *Auditor jefe* y mantiene a `carla.eval` como *Auditor evaluador* (CU-7). |
| 18-dic-2025 | `bruno.jefe` | Crea la organización NEXUM con sus objetivos y 5 factores críticos (CU-8). |
| 18-dic-2025 | `bruno.jefe` | Importa el CSV con los 12 indicadores (CU-16). |
| 19-dic-2025 | `bruno.jefe` | Crea los cuatro procesos P1–P4, asocia indicadores y factores críticos (CU-20). |
| 20-dic-2025 | `bruno.jefe` | Crea la auditoría *NEXUM-Q1-2026* y la asigna a `carla.eval` (CU-25). Estado: `No iniciada`. El sistema envía email a Carla. |
| 01-ene-2026 | (sistema) | La auditoría pasa automáticamente a `Pendiente de evaluar` (rojo). |
| 05-abr-2026 | `carla.eval` | Entra en *Pending audits*, abre *NEXUM-Q1-2026* y evalúa (CU-32): introduce valores reales e ideales de los 4 procesos y rellena 4 matrices de Saaty. Pulsa *Finish*. Estado → `Evaluada` (azul). El sistema calcula los índices por proceso y el coeficiente global. |
| 06-abr-2026 | `bruno.jefe` | Revisa resultados, decide cerrar manualmente la auditoría (CU-33). Estado → `Cerrada` (verde). |
| 06-abr-2026 | `bruno.jefe` | *Audits → Reports* → descarga el PDF de la auditoría (CU-34). |
| 07-abr-2026 | `bruno.jefe` | *Statistics* → compara *NEXUM-Q1-2026* con *NEXUM-Q3-2025* (CU-38) para medir avance. |

### 4.7. Ejemplo de evaluación del proceso P2 (CPD)

Valores introducidos por `carla.eval`:

| Indicador | Real | Ideal | Normalizado (ilustrativo) |
|---|---|---|---|
| I1 Consumo CPD | 48 000 kWh/mes | 35 000 kWh/mes | 0,73 |
| I2 PUE | 1,62 | 1,20 | 0,74 |
| I3 % renovable | 42 % | 100 % | 0,42 |

Matriz de Saaty rellenada por la evaluadora (importancia relativa):

|   | I1 | I2 | I3 |
|---|---|---|---|
| **I1** | 1 | 1/3 | 1/5 |
| **I2** | 3 | 1 | 1/3 |
| **I3** | 5 | 3 | 1 |

Pesos derivados (vector propio normalizado): I1 ≈ 0,11 · I2 ≈ 0,26 · I3 ≈ 0,63.

Índice de sostenibilidad de P2 ≈ 0,73·0,11 + 0,74·0,26 + 0,42·0,63 ≈ **0,54**.

El mismo procedimiento se repite para P1, P3 y P4; la media ponderada da el **coeficiente global** de la auditoría.

### 4.8. Salidas que obtiene la empresa

1. **Informe PDF** con la foto completa de la auditoría Q1-2026 (entidades, indicadores, pesos, índices, coeficiente).
2. **Panel de estadísticas** de la auditoría: dimensiones cubiertas (Ambiental, Técnica, Social, Gubernamental), nº de factores críticos implicados (5) y ranking de procesos por índice.
3. **Serie histórica** de NEXUM (hasta 100 auditorías) para ver tendencia del coeficiente.
4. **Comparativa** auditoría a auditoría para detectar qué proceso mejora o empeora.

---

## 5. Resumen matricial rol × fase

| Rol \ Fase | 0 Alta | 1 Setup | 2 Procesos | 3 Auditoría | 4 Evaluar | 5 Cierre+Reporte |
|---|---|---|---|---|---|---|
| **Administrador** | Asigna roles (CU-7) | Puede crear org/indicadores | Puede crear procesos | Puede crear auditoría | — (no evalúa) | Puede cerrar, ver informe y stats |
| **Auditor jefe** | — | Crea org (CU-8), indicadores (CU-13/16) | Crea procesos (CU-20) | Crea y asigna auditoría (CU-25) | — (no evalúa) | **Cierra** (CU-33), descarga informe (CU-34), compara (CU-38) |
| **Auditor evaluador** | Se registra (CU-1) | Consulta repositorio (CU-18/19) | Consulta procesos (CU-23/24) | Recibe notificación email | **Evalúa** valores + Saaty (CU-32) | Consulta informe y últimas 10 auditorías (CU-36) |

---

## 6. Notas importantes sobre el estado actual

- El motor matemático (normalización + AHP/Saaty) es **intocable** y es el que produce los índices.
- Aún **no existe** jerarquía CSRD/ESRS (Framework → Standard → DR → DataPoint) ni formularios dinámicos por tipo de dato: esas son las mejoras del TFG en curso.
- Toda evaluación es **numérica**: sólo se manejan valores reales/ideales cuantitativos. No se recogen respuestas narrativas, fechas ni booleanos.
- La auditoría es **auto-contenida**: cada auditoría guarda sus propias copias de valores, pesos y celdas Saaty, de modo que borrar un indicador del repositorio no destruye los resultados históricos (aparece como `Inactive` en comparaciones).
- Las notificaciones al auditor evaluador son **por email** en tres hitos: creación, modificación y eliminación de la auditoría asignada.
