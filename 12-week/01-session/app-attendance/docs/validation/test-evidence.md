# Evidencia de Validacion

Fecha: 2026-04-29

## Validaciones ejecutadas

| Comando | Resultado | Nota |
|---|---|---|
| `npm --prefix back run typecheck` | PASS | TypeScript backend sin errores |
| `npm --prefix back run build` | PASS | API compila a `back/dist` |
| `npm --prefix app run typecheck` | PASS | TypeScript app sin errores |
| `npm --prefix app run build` | PASS | App Ionic/Vite compila a `app/dist` |
| `npm run typecheck` | PASS | Validacion agregada |
| `npm run build` | PASS | Build agregado |
| `node --check db/scripts/initial-data.mongodb.js` | PASS | Seed sin error de sintaxis |
| `docker compose config` | PASS | Compose base valido |
| `docker compose --profile seed config` | PASS | Compose con seed valido |
| `docker compose up -d mongo api` | BLOQUEADO | Docker Desktop/Linux engine no disponible en la maquina |
| `Invoke-WebRequest http://localhost:5173` | PASS | App dev server responde 200 |
| `docker compose --profile seed up db-seed` | PASS | Fuente real cargada: 2 instituciones, 9 grupos, 253 personas, 265 inscripciones |
| `GET /api/institutions` + unidades/personas | PASS | CORHUILA: 6 materias; SENA: 3 fichas |
| Registro QR SENA con documento real | PASS | `ficha-3145555`, documento `1075508460`, presente registrado |
| Registro QR CORHUILA con documento real | PASS | `base-de-datos-ii`, documento `1077722121`, presente registrado |

## Bloqueo runtime

Docker no estaba disponible al validar:

```text
open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
```

Cuando Docker Desktop este activo, ejecutar:

```powershell
npm run docker:up
npm run docker:seed
Invoke-RestMethod http://localhost:4000/health
Invoke-RestMethod http://localhost:4000/ready
```

## Validacion posterior con Docker activo

Docker fue activado posteriormente y el seed real se cargo correctamente desde:

```text
db/source/seed_asistencia_corhuila_sena_mongo_local.json
```

Resumen cargado:

- Instituciones: 2.
- Grupos academicos: 9.
- Personas unicas: 253.
- Inscripciones: 265.

Prueba funcional ejecutada:

- SENA: asistencia aceptada para documento real `1075508460`.
- CORHUILA: asistencia aceptada para documento real `1077722121`.
