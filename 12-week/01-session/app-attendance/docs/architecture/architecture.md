# Arquitectura — app-attendance

## Topología de ejecución

```
Celular del estudiante
    │ (Escanea QR con cámara)
    ▼
Navegador → GET /attendance/{token}   ← HTML form público
             POST /public/attendance/{token}/register
                    │
                    ▼
              API (back/)
              Express 5 + Mongoose
              Puerto 4000
                    │ Autenticado con JWT (rutas /api/*)
                    │
              PC instructor/docente
              App Ionic React (app/)
              Puerto 8080 (dev) / localhost capacitor
                    │
                    ▼
              MongoDB 7
              Puerto 27017
              Volumen Docker persistente
```

## Capas

| Capa | Tecnología | Puerto | Responsabilidad |
|---|---|---|---|
| `app/` | Ionic React + Vite + Capacitor | 8080 (docker) / 5173 (dev) | UI del instructor/docente |
| `back/` | Node 20 + Express 5 + Mongoose | 4000 | Reglas de negocio, validación, JWT |
| `db/` | MongoDB 7 | 27017 | Persistencia, seed idempotente |

## Flujo de autenticación

```
App (instructor) → POST /api/auth/login {documento, password}
                ← JWT (24h) + datos del usuario

App → todas las rutas /api/* con Authorization: Bearer <JWT>
API → middleware authenticate → verifica JWT → pasa req.user al handler
```

## Flujo de sesión de asistencia

```
Instructor → POST /api/sessions            → crea sesión draft
          → POST /api/sessions/:id/activate → genera QR token
          → QR URL = {backendUrl}/attendance/{token}
          → muestra QR en pantalla

Estudiante → escanea QR → formulario HTML
          → POST /public/attendance/{token}/register {documento}
          → validaciones: token activo, persona inscrita, sin duplicado
          → registro accepted o rejected con reason code

Instructor → GET /api/sessions/:id/present | absent | rejections
          → ve resultados en tiempo real (auto-refresh 10s cuando activa)
          → POST /api/sessions/:id/close → cierra sesión
```

## Restricciones de diseño

- No SQLite, no Atlas, no backend embebido en la app.
- Frontend NO se conecta directamente a MongoDB.
- URLs de backend configurables en runtime (permite túnel HTTP en clase).
- Token QR es opaco — el backend tiene todo el estado de la sesión.
- Colores institucionales pendientes de confirmación oficial (`officialColorsConfirmed: false`).

## Infraestructura Docker Compose

```yaml
mongo      → MongoDB 7 con healthcheck
db-seed    → mongosh idempotente (carga datos reales o sintéticos)
api        → imagen del backend, espera a que db-seed complete
app        → nginx sirviendo el build de Vite
```
