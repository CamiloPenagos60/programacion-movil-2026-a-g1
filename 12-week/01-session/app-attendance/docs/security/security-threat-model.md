# Modelo de Amenazas y Controles de Seguridad

## Activos a proteger

| Activo | Criticidad |
|---|---|
| Datos de asistencia (quién, cuándo, dónde) | Alta |
| Credenciales de formadores (documento + contraseña) | Alta |
| Secreto JWT (`JWT_SECRET`) | Alta |
| Tokens QR activos | Media |
| Datos personales (nombre, documento) | Alta (RGPD/regulación) |

## Amenazas y mitigaciones

### A1 — Control de acceso roto
- **Riesgo**: Estudiante accede a endpoints de instructores.
- **Mitigación**: `authenticate` middleware protege toda la ruta `/api/*`. Solo `/api/auth/login` y `/public/*` son abiertos.
- **Mitigación**: Verificar `roles` en `authorizeRole(...)` para operaciones administrativas.

### A2 — Falla criptográfica
- **Riesgo**: `JWT_SECRET` débil o expuesto en código.
- **Mitigación**: Secret en variable de entorno, valor por defecto solo para dev, nunca en commits de producción.
- **Riesgo**: Contraseñas en plain text en seed.
- **Mitigación**: Solo en dev. El controlador de auth soporta bcrypt (`$2b$` prefix detection) para migración gradual.
- **Pendiente**: Script de migración de contraseñas plain text a bcrypt antes de producción.

### A3 — Inyección
- **Riesgo**: Inyección NoSQL en query Mongoose.
- **Mitigación**: Validación Zod en todos los inputs de rutas. Mongoose usa sanitización de queries por defecto.

### A4 — SSRF / Fetch externo
- **Riesgo**: URL de backend configurable por el usuario → podría apuntar a servicios internos.
- **Mitigación**: El frontend usa la URL solo para llamadas HTTP de la app (no expone ni retransmite a terceros).
- **Pendiente**: Considerar whitelist de esquemas (solo http/https) en `BackendConfigPage`.

### A5 — Token QR
- **Riesgo**: QR token predecible o reutilizable.
- **Mitigación**: Token UUID v4 generado en servidor, TTL configurable, expiración verificada en cada registro.
- **Mitigación**: Una sesión solo puede tener un token activo a la vez.

### A6 — Exposición de datos en respuestas
- **Riesgo**: Contraseña hasheable devuelta en JSON.
- **Mitigación**: `PersonModel.findOne().select('+password')` solo en login. `serializePerson()` hace `delete serialized["password"]` explícito.

### A7 — JWT sin expiración
- **Riesgo**: Token robado válido indefinidamente.
- **Mitigación**: `expiresIn: "24h"`. Sin refresh token actualmente (aceptable para MVP).
- **Pendiente**: Considerar lista de revocación o refresh token en versión post-MVP.

## Controles activos verificados

- [x] JWT verificado en middleware antes de cualquier handler protegido.
- [x] `password` excluido por defecto en schema Mongoose (`select: false`).
- [x] `password` eliminado explícitamente en `serializePerson`.
- [x] Zod valida body de login (tipos + presencia).
- [x] `FORMADOR_ROLES` limita quién puede autenticarse como formador.
- [x] Seed contiene solo datos sin datos sensibles reales (se usan documentos reales del seed fuente, no inventados).

## Pendientes antes de producción

- [ ] Migrar contraseñas de seed plain text a bcrypt.
- [ ] Cambiar `JWT_SECRET` a valor largo y aleatorio (≥ 32 chars).
- [ ] Configurar CORS restrictivo (`API_CORS_ORIGIN` al dominio real).
- [ ] Agregar rate limiting en `/api/auth/login`.
- [ ] TLS (HTTPS) obligatorio en producción.
- [ ] Revisar headers HTTP de seguridad (Helmet.js).
