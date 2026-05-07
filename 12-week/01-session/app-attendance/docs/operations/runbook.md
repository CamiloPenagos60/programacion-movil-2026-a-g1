# Runbook de Operaciones — app-attendance

## Levantar el stack completo

```powershell
# Primer inicio o rebuild completo
docker compose down -v   # solo si quieres recrear volúmenes
docker compose up -d --build

# Verificar estado
docker compose ps
docker compose logs -f api
```

El servicio `db-seed` se ejecuta una sola vez y termina. Es idempotente: volver a correrlo no duplica datos.

## Apagado

```powershell
docker compose down        # conserva volúmenes (datos preservados)
docker compose down -v     # destruye volúmenes (datos perdidos)
```

## Ver logs

```powershell
docker compose logs -f api       # backend
docker compose logs -f mongo     # base de datos
docker compose logs db-seed      # resultado del seed
```

## Variables de entorno

1. Copiar `.env.example` → `.env`
2. Cambiar `JWT_SECRET` por un valor fuerte en producción.
3. `docker compose` lee `.env` automáticamente.

## Accesos locales

| Servicio | URL |
|---|---|
| Frontend | http://localhost:8080 |
| Backend API | http://localhost:4000 |
| Health check | http://localhost:4000/health |
| MongoDB | mongodb://localhost:27017 |

## Desarrollo backend sin Docker

```powershell
cd back
npm install
# Necesita .env con MONGO_URI apuntando a mongo local o Docker
npm run dev        # ts-node-dev con reload
npm run typecheck  # verifica tipos sin compilar
npm test           # vitest unit tests
```

## Desarrollo frontend sin Docker

```powershell
cd app
npm install
npm run dev        # Vite dev server en puerto 5173
```

Configurar la URL del backend en la app: pantalla "Backend" → ingresar `http://localhost:4000`.

## Credenciales de prueba (seed de datos reales)

- **Instructor SENA**: documento `1079606375`, password `1079606375`
- **Docente CORHUILA**: documento `1079606375`, password `1079606375` (misma persona, institución diferente)

> Los estudiantes/aprendices no pueden autenticarse en la app de instructores (FORMADOR_ROLES limita el acceso).

## Rebuild de imagen tras cambios en package.json

```powershell
docker compose build api
docker compose up -d api
```

## Re-ejecutar seed manualmente

```powershell
docker compose run --rm db-seed
```

## Solución de problemas comunes

| Síntoma | Causa probable | Acción |
|---|---|---|
| `Error: JWT_SECRET is required` | Falta `.env` | Crear `.env` desde `.env.example` |
| Login devuelve 401 con credenciales correctas | `npm install` no ejecutado en `back/` | `docker compose build api` |
| QR no aparece al activar sesión | Servicio api inaccesible desde la app | Verificar URL en config de la app |
| `MongoServerError: Authentication failed` | Credenciales de Mongo incorrectas | Verificar `MONGO_URI` en `.env` |
| Seed no carga datos | Archivo fuente no presente en `db/source/` | Verificar que el JSON esté en la ruta correcta |
