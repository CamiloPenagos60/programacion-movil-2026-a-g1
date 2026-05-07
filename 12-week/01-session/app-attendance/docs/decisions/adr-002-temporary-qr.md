# ADR 002: QR Temporal Basado en Token Publico

- Fecha: 2026-04-29
- Estado: Aceptado

## Contexto

El QR no debe contener informacion sensible ni datos completos del estudiante. Debe expirar y depender del estado de una sesion de asistencia.

## Decision

El backend genera un `qrToken` aleatorio por sesion activa. El QR apunta a:

```text
{backend_public_url}/attendance/{qrToken}
```

El token solo identifica una sesion. El backend valida estado, expiracion, unidad academica, documento y duplicados antes de aceptar asistencia.

## Consecuencias

- El QR no expone ficha, materia, documento ni credenciales.
- Cambiar el tunel no exige recompilar la app.
- El cierre o expiracion de la sesion invalida el QR.

