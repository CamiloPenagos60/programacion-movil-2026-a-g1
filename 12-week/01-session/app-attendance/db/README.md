# Base de Datos Local

MongoDB corre localmente en Docker y se usa solo desde el backend.

## Levantar MongoDB

```powershell
Copy-Item .env.example .env
docker compose up -d mongo
```

## Cargar seeds

```powershell
docker compose --profile seed up db-seed
```

El script ejecutable esta en:

```text
db/scripts/initial-data.mongodb.js
```

Ese script lee la fuente real:

```text
db/source/seed_asistencia_corhuila_sena_mongo_local.json
```

El archivo fuente contiene 2 instituciones, 9 grupos academicos, 253 personas unicas y 265 inscripciones. El seed es idempotente: puede ejecutarse varias veces sin duplicar instituciones, unidades academicas, personas ni inscripciones.

Si una persona aparece en varias materias CORHUILA, queda una sola vez en `people` y varias veces en `enrollments`.

## Validar datos

```powershell
docker exec -it app-attendance-mongo mongosh "mongodb://attendance:attendance_dev_password@localhost:27017/app_attendance?authSource=admin"
```

Comandos utiles dentro de `mongosh`:

```javascript
db.institutions.find()
db.academic_units.find()
db.people.find()
db.enrollments.find()
```

## Colecciones

- `institutions`: instituciones, labels y configuracion visual.
- `academic_units`: fichas o materias.
- `people`: personas con `documento`, `nombre` y `matricula`.
- `enrollments`: inscripcion de persona a ficha/materia.
- `attendance_sessions`: sesiones de asistencia.
- `attendance_records`: registros aceptados y rechazos.
