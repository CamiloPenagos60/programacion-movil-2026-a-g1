# ADR 001: Stack y Fronteras de Responsabilidad

- Fecha: 2026-04-29
- Estado: Aceptado

## Contexto

La app requiere Ionic React + Capacitor, backend API dockerizado y MongoDB local en Docker. No debe existir conexion directa desde la app a MongoDB ni backend embebido en el cliente movil.

## Decision

Usar:

- Ionic React + Vite + Capacitor para `app`.
- Node.js + TypeScript + Express + Mongoose para `back`.
- MongoDB local con Docker Compose y seed idempotente en `db`.

## Alternativas evaluadas

| Alternativa | Pros | Contras | Razon de descarte |
|---|---|---|---|
| Backend embebido en app | Menos servicios | Viola restriccion explicita | No permitido |
| SQLite en app | Offline simple | Viola restriccion explicita | No permitido |
| MongoDB Atlas | Gestionado | Viola restriccion de Mongo local | No permitido |

## Consecuencias

- La app solo consume API REST.
- El backend concentra validaciones de sesion, QR, duplicados y persistencia.
- Docker Compose permite levantar entorno local reproducible.

