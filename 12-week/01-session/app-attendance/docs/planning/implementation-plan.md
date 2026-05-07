# Plan de Implementacion

## Fase 1: Base del repositorio

- Crear estructura `app`, `back`, `db`, `docs`.
- Crear reglas agentic minimas.
- Crear README y comandos raiz.

## Fase 2: Datos y MongoDB

- Definir colecciones.
- Crear seed idempotente.
- Crear indices de integridad.
- Documentar carga y validacion.

## Fase 3: Backend API

- Crear API TypeScript.
- Conectar a MongoDB.
- Exponer health/readiness.
- Implementar catalogos, sesiones, QR y registro publico.
- Validar errores de negocio.

## Fase 4: App Ionic React

- Configurar URL backend/tunel.
- Seleccionar institucion.
- Seleccionar ficha/materia.
- Listar aprendices/estudiantes.
- Crear/activar/cerrar sesiones.
- Mostrar QR temporal.
- Consultar presentes, ausentes, rechazados e historial.

## Fase 5: Integracion local

- Levantar MongoDB y API con Docker Compose.
- Ejecutar seed.
- Validar flujo completo con datos reales.

## Fase 6: Madurez minima

- Documentar contrato API.
- Documentar modelo de datos.
- Documentar pruebas funcionales.
- Registrar ADRs relevantes.

