# Contexto del Proyecto

## Objetivo

Aplicacion movil para toma de asistencia academica con QR temporal y codigo de sala anti-fraude (CSR), usando Ionic React + Capacitor, API backend dockerizada y MongoDB local en Docker.

## Stack Tecnico

| Capa | Tecnologia |
|------|-----------|
| Frontend | Ionic React 8 + Vite + Capacitor 7 |
| Backend | Node.js 20 + TypeScript + Express 5 + Zod 4 |
| Base de datos | MongoDB 7 via Docker + Mongoose 9 |
| Auth | JWT 24h (jsonwebtoken 9) + bcryptjs 2 |
| Contenedores | Docker Compose (mongo, api, app, db-seed) |
| Reportes | xlsx 0.18.5 (multi-sesion Excel) |

## Instituciones

### SENA
- Rol formador: Instructor
- Unidad academica: Ficha
- Persona inscrita: Aprendiz (rol: APRENDIZ)
- Colores: parametrizados. Pendiente confirmar valores oficiales.

### CORHUILA / Universidad
- Rol formador: Docente
- Unidad academica: Materia
- Persona inscrita: Estudiante (rol: ESTUDIANTE)
- Colores: parametrizados. Pendiente confirmar valores oficiales.

## Roles disponibles

`ADMIN` · `INSTRUCTOR` · `DOCENTE` · `APRENDIZ` · `ESTUDIANTE`

Una persona puede tener multiples roles (array). Los permisos se calculan por union de roles.
El sistema soporta que la misma persona sea INSTRUCTOR en una institucion y DOCENTE en otra.

## Flujo de autenticacion

1. `POST /api/auth/login` con `{ documento, password }`
2. Backend busca persona activa por documento (cualquier rol)
3. Si el password empieza con `$2` → bcrypt.compare(); si no → comparacion directa (dev)
4. Respuesta: `{ token (JWT 24h), person { id, institutionId, documento, nombre, roles } }`
5. Frontend guarda token en `@capacitor/preferences` (no localStorage)
6. Todas las rutas `/api/*` (excepto `/api/auth/*` y publicas) requieren `Authorization: Bearer <token>`
7. Autorización por recurso/accion via coleccion `permissions` en MongoDB

## Sistema anti-fraude CSR (Codigo de Sala Rotativo)

- El instructor activa la sesion → genera QR + codigo de sala de 6 caracteres
- El codigo rota automaticamente cada 90 segundos (configurable: `ROOM_CODE_TTL_SECONDS`)
- Charset: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (visualmente no ambiguos)
- El aprendiz/estudiante autenticado ingresa el codigo en su app → registro con doble prueba (JWT + codigo)
- `GET /api/sessions/:id/room-code` → instructor ve el codigo con cuenta regresiva
- `POST /api/attendance/checkin` → aprendiz registra asistencia con el codigo

## Usuarios seed de desarrollo

| Nombre | Documento | Password | Rol SENA | Rol CORHUILA |
|--------|-----------|----------|----------|--------------|
| Instructor SENA | 1079606375 | 1079606375 | INSTRUCTOR | — |
| Docente CORHUILA | 1079606375 | 1079606375 | — | DOCENTE |
| Jesús González | 0000000001 | qwerty.2026 | INSTRUCTOR | DOCENTE |
| Aprendices/Estudiantes | (del seed fuente) | (documento) | APRENDIZ o ESTUDIANTE | — |

**Notas:**
- Jesús González tiene password almacenada con bcrypt (cost=10). Los demas con texto plano (solo dev).
- Jesús González demuestra soporte de doble rol: INSTRUCTOR en SENA y DOCENTE en CORHUILA.
- Antes de produccion ejecutar el script de migracion de passwords.

## Variables de entorno

| Variable | Default | Descripcion |
|----------|---------|-------------|
| `MONGO_URI` | `mongodb://attendance:attendance_dev_password@mongo:27017/app_attendance?authSource=admin` | URI de conexion |
| `JWT_SECRET` | `super-secret-key-for-dev-only` | **Cambiar en produccion** |
| `QR_DEFAULT_TTL_MINUTES` | `10` | TTL del QR de sesion |
| `ROOM_CODE_TTL_SECONDS` | `90` | TTL del codigo de sala rotativo (30-300) |
| `API_CORS_ORIGIN` | `*` | Origen CORS permitido |
| `PORT` | `4000` | Puerto del backend |
| `APP_PORT` | `8080` | Puerto del frontend |

## Comandos

```bash
# Levantar todo desde cero
docker compose up -d --build

# Solo rebuild backend
docker compose up -d --build api

# Solo rebuild frontend
docker compose up -d --build app

# Typecheck backend
cd back && npx tsc --noEmit

# Build frontend
cd app && npm run build

# Tests backend
cd back && npm test

# Ver logs del backend
docker compose logs -f api
```

## Flujo operativo en clase

1. PC con Docker activo
2. `docker compose up -d` (primera vez: `--build`)
3. Tunel publico exponiendo el backend (ej. ngrok, localhost.run)
4. App instalada en celular → configurar URL del backend
5. Instructor inicia sesion y activa QR + codigo de sala
6. Estudiantes/aprendices inician sesion → ingresan codigo de sala

## Restricciones

- Sin SQLite local en app.
- Sin MongoDB Atlas.
- Sin backend embebido.
- La app no contiene credenciales de base de datos.
- La URL del backend no esta quemada en la app (se configura en runtime).

## Pendientes tecnicos

- [ ] Confirmar colores oficiales de SENA y CORHUILA.
- [ ] Script de migracion de passwords a bcrypt para produccion.
- [ ] Configurar `JWT_SECRET` seguro en entorno de produccion.
- [ ] Definir estrategia de despliegue AWS (ECS/EC2 + Atlas o DocumentDB).
- [ ] Limitar `API_CORS_ORIGIN` al dominio de produccion.

