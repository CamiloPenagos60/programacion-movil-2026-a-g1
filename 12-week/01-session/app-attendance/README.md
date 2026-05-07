# App Attendance

Aplicacion real para toma de asistencia academica con QR temporal.

## Arquitectura

- `app/`: cliente movil Ionic React + Capacitor. No se conecta a MongoDB.
- `back/`: API REST dockerizable. Es la unica capa que consulta y escribe en MongoDB.
- `db/`: MongoDB local, seeds e instrucciones de datos.
- `docs/`: contexto, decisiones, contratos, plan y validaciones.

## Inicio rapido local

1. Instalar dependencias:

```powershell
npm run install:all
```

2. Copiar variables:

```powershell
Copy-Item .env.example .env
```

3. Levantar MongoDB y API:

```powershell
npm run docker:up
```

4. Cargar datos iniciales:

```powershell
npm run docker:seed
```

El seed funciona con switch automatico:

- Si defines `SEED_SOURCE_PATH`, usa esa ruta.
- Si no defines `SEED_SOURCE_PATH` y existe el archivo real local, usa el real.
- Si no existe el real, usa el sintetico versionado en Git.

Seed sintetico versionado:

```text
db/source/seed_asistencia_sintetica_mongo_local.json
```

Si quieres forzar una ruta especifica, configura `SEED_SOURCE_PATH` en `.env`:

```env
SEED_SOURCE_PATH=/source/seed_asistencia_corhuila_sena_mongo_local.json
```

Luego vuelve a ejecutar:

```powershell
npm run docker:seed
```

5. Validar API:

```powershell
Invoke-RestMethod http://localhost:4000/health
Invoke-RestMethod http://localhost:4000/ready
```

6. Ejecutar app en desarrollo:

```powershell
npm run dev:app
```

La app permite configurar la URL activa del backend o tunel. En local usa:

```text
http://localhost:4000
```

## Flujo de asistencia

1. Configurar y validar URL del backend.
2. Seleccionar institucion: SENA o CORHUILA/Universidad.
3. Seleccionar ficha o materia.
4. Revisar listado precargado.
5. Crear y activar sesion.
6. Mostrar QR temporal.
7. Estudiante registra documento desde su celular.
8. Ver presentes, ausentes y duplicados rechazados.
9. Cerrar sesion.
10. Consultar historial.

## Tunel publico

Expone `http://localhost:4000` con la herramienta de tunel que prefieras. Ejemplos:

```powershell
cloudflared tunnel --url http://localhost:4000
```

o

```powershell
ngrok http 4000
```

Luego configura la URL publica en la pantalla de configuracion de la app. El QR se genera usando esa URL activa.

## Documentacion clave

- `docs/context/project-context.md`
- `docs/agentic/AGENTS.md`
- `docs/api/api-contract.md`
- `docs/db/data-model.md`
- `docs/planning/implementation-plan.md`
- `docs/validation/runtime-checklist.md`

