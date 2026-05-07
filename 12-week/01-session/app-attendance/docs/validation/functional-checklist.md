# Checklist Funcional

## Preparacion

- [ ] Docker Desktop activo.
- [ ] `.env` creado desde `.env.example`.
- [ ] `npm run install:all` ejecutado.
- [ ] `npm run docker:up` activo.
- [ ] `npm run docker:seed` ejecutado.
- [ ] `GET /ready` responde `ready`.

## Flujo SENA

- [ ] Configurar URL backend.
- [ ] Seleccionar SENA.
- [ ] Ver rol Instructor.
- [ ] Ver unidades como Ficha.
- [ ] Ver personas como Aprendices.
- [ ] Crear sesion sobre una ficha.
- [ ] Activar QR.
- [ ] Registrar documento valido SENA desde el QR.
- [ ] Ver presente en la app.
- [ ] Reintentar mismo documento y ver rechazo duplicado.
- [ ] Cerrar sesion.
- [ ] Intentar registrar despues del cierre y ver rechazo.

## Flujo CORHUILA / Universidad

- [ ] Seleccionar CORHUILA.
- [ ] Ver rol Docente.
- [ ] Ver unidades como Materia.
- [ ] Ver personas como Estudiantes.
- [ ] Crear sesion sobre una materia.
- [ ] Registrar estudiante inscrito.
- [ ] Registrar estudiante de otra materia y ver rechazo.
- [ ] Ver presentes, ausentes y rechazos.
- [ ] Ver historial.

## Tunel

- [ ] Exponer `http://localhost:4000`.
- [ ] Configurar URL publica en la app.
- [ ] Validar `/health` y `/ready` desde la app.
- [ ] Generar QR con URL publica.
- [ ] Abrir QR desde otro celular.

