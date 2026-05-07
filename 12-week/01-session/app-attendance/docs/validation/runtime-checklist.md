# Runtime Checklist

## Base de datos

- [ ] `docker compose up -d mongo` levanta MongoDB.
- [ ] `docker compose --profile seed up db-seed` carga seeds sin error.
- [ ] Existen instituciones SENA y CORHUILA.
- [ ] Existen fichas/materias con personas inscritas.

## Backend

- [ ] `GET /health` responde `ok`.
- [ ] `GET /ready` confirma conexion a MongoDB.
- [ ] Los endpoints de catalogo responden con datos reales.
- [ ] Crear sesion falla si la ficha/materia no tiene personas.
- [ ] Activar sesion genera token temporal.
- [ ] Cerrar sesion impide nuevos registros.

## QR y registro

- [ ] El QR apunta a `/attendance/:token`.
- [ ] Token inexistente muestra error util.
- [ ] Token expirado rechaza registro.
- [ ] Documento no encontrado se registra como rechazo.
- [ ] Documento de otra ficha/materia se registra como rechazo.
- [ ] Documento duplicado se registra como rechazo.
- [ ] Documento valido queda como presente.

## App

- [ ] URL invalida no permite continuar.
- [ ] Backend sin MongoDB no permite iniciar asistencia.
- [ ] Seleccion SENA usa labels Instructor, Ficha, Aprendiz.
- [ ] Seleccion universidad usa labels Docente, Materia, Estudiante.
- [ ] Presentes, ausentes y rechazados se actualizan desde API.
- [ ] Historial basico carga sesiones persistidas.

