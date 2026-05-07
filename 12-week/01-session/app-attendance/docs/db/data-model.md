# Modelo de Datos MongoDB

## Alcance

Soporta asistencia academica para SENA y CORHUILA/Universidad con QR temporal, sin autenticacion y con datos precargados desde `db/source/seed_asistencia_corhuila_sena_mongo_local.json`.

## Glosario

| Termino | Definicion | Traduccion tecnica |
|---|---|---|
| Institucion | SENA o CORHUILA/Universidad | `institutions` |
| Ficha | Agrupacion academica SENA | `academic_units.type = ficha` |
| Materia | Agrupacion academica universidad | `academic_units.type = materia` |
| Aprendiz/Estudiante | Persona inscrita | `people` + `enrollments` |
| Sesion de asistencia | Evento temporal abierto por instructor/docente | `attendance_sessions` |
| Registro | Intento de marcar asistencia | `attendance_records` |

## Colecciones

### `institutions`

| Campo | Tipo | Obligatorio | Justificacion |
|---|---|---|---|
| `_id` | ObjectId | Si | Identidad interna |
| `code` | string | Si | Selector estable: SENA, CORHUILA |
| `name` | string | Si | Nombre visible |
| `context` | enum | Si | Diferencia `sena` y `university` |
| `labels` | object | Si | Rol y nombres por institucion |
| `theme` | object | Si | Visual parametrizable sin asumir colores oficiales |
| `qr.ttlMinutes` | number | Si | TTL por defecto |
| `active` | boolean | Si | Filtrado operativo |
| `createdAt`, `updatedAt` | date | Si | Auditoria minima |

### `academic_units`

| Campo | Tipo | Obligatorio | Justificacion |
|---|---|---|---|
| `_id` | ObjectId | Si | Identidad interna |
| `institutionId` | ObjectId | Si | Pertenece a institucion |
| `code` | string | Si | Codigo de ficha o materia |
| `name` | string | Si | Nombre visible |
| `type` | enum | Si | `ficha` o `materia` |
| `active` | boolean | Si | Filtrado operativo |
| `createdAt`, `updatedAt` | date | Si | Auditoria minima |

### `people`

| Campo | Tipo | Obligatorio | Justificacion |
|---|---|---|---|
| `_id` | ObjectId | Si | Identidad interna |
| `institutionId` | ObjectId | Si | Evita mezcla entre instituciones |
| `documento` | string | Si | Dato visible y llave de registro desde QR |
| `nombre` | string | Si | Dato visible |
| `matricula` | string | Si | Dato visible institucional |
| `active` | boolean | Si | Permite desactivar sin borrar |
| `createdAt`, `updatedAt` | date | Si | Auditoria minima |

### `enrollments`

| Campo | Tipo | Obligatorio | Justificacion |
|---|---|---|---|
| `_id` | ObjectId | Si | Identidad interna |
| `institutionId` | ObjectId | Si | Consulta por institucion |
| `unitId` | ObjectId | Si | Ficha o materia |
| `personId` | ObjectId | Si | Persona inscrita |
| `active` | boolean | Si | Retiro o inactivacion |
| `createdAt`, `updatedAt` | date | Si | Auditoria minima |

### `attendance_sessions`

| Campo | Tipo | Obligatorio | Justificacion |
|---|---|---|---|
| `_id` | ObjectId | Si | Identidad interna |
| `institutionId` | ObjectId | Si | Validacion de contexto |
| `unitId` | ObjectId | Si | Ficha o materia tomada |
| `status` | enum | Si | `draft`, `active`, `closed`, `expired` |
| `qrToken` | string | No | Token publico del QR, no contiene datos sensibles |
| `qrExpiresAt` | date | No | Expiracion del QR |
| `qrTtlMinutes` | number | Si | Minutos configurados |
| `activatedAt` | date | No | Auditoria de activacion |
| `closedAt` | date | No | Auditoria de cierre |
| `createdAt`, `updatedAt` | date | Si | Auditoria minima |

### `attendance_records`

| Campo | Tipo | Obligatorio | Justificacion |
|---|---|---|---|
| `_id` | ObjectId | Si | Identidad interna |
| `sessionId` | ObjectId | Si | Sesion evaluada |
| `institutionId` | ObjectId | Si | Contexto de validacion |
| `unitId` | ObjectId | Si | Ficha/materia evaluada |
| `personId` | ObjectId | No | Nulo en documento no encontrado |
| `documento` | string | Si | Documento enviado desde QR |
| `status` | enum | Si | `accepted` o `rejected` |
| `rejectReason` | enum | No | Motivo de rechazo |
| `message` | string | Si | Mensaje legible |
| `createdAt`, `updatedAt` | date | Si | Auditoria minima |

## Indices

- `institutions.code` unico.
- `academic_units.institutionId + code` unico.
- `people.institutionId + documento` unico.
- `enrollments.unitId + personId` unico.
- `attendance_sessions.qrToken` unico sparse.
- `attendance_records.sessionId + personId + status` unico parcial para `accepted`.

## Fuente real cargada

El seed oficial toma como entrada `db/source/seed_asistencia_corhuila_sena_mongo_local.json`.

Resumen de la fuente:

- 2 instituciones: SENA y CORHUILA.
- 6 materias CORHUILA.
- 3 fichas SENA.
- 265 filas de personas inscritas.
- 253 personas unicas por institucion/documento.

Las personas duplicadas por documento dentro de una misma institucion se conservan como una sola persona y se relacionan con varias materias mediante `enrollments`.
