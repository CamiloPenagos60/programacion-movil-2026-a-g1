# Pattern Guide — app-attendance

Patrones de código vigentes. Todo cambio debe respetar estas convenciones.

## Backend (`back/`)

### Controladores

- Cada handler se exporta como función nombrada.
- Se envuelve con `asyncHandler` en la capa de rutas (nunca en el controlador).
- Errores de negocio: `throw new AppError(message, code, httpStatus)`.
- Validación de input con Zod en `validators/` antes de llegar al controlador.
- Validación de tipos de request: `const { field } = req.body as { field?: unknown }`, luego narrowing explícito.

```ts
// Correcto
export const postSession = asyncHandler(async (req, res) => {
  const body = SessionCreateSchema.parse(req.body);
  const session = await AttendanceService.createSession(body);
  res.status(201).json({ data: serializeSession(session.toObject()) });
});
```

### Servicios

- Lógica de negocio pura en `services/`.
- No acceden a `req`/`res` — solo reciben datos planos.
- Lanzan `AppError` con código semántico cuando una regla de negocio falla.

### Serialización

- Nunca retornar documentos Mongoose crudos a la capa HTTP.
- Usar `serializePerson`, `serializeSession`, etc. de `services/serializers.ts`.
- `password` NUNCA aparece en respuestas API (excluido explícitamente en `serializePerson`).

### Autenticación

- `authenticate` middleware verifica el JWT (Bearer token).
- Se aplica a nivel de router en `app.ts`: `app.use('/api', authenticate, router)`.
- Rutas públicas montadas ANTES de la capa autenticada.
- El payload JWT contiene: `{ id, institutionId, documento, nombre, roles }`.

### Variables de entorno

- Centralizadas en `config/env.ts` usando Zod schema.
- Nunca `process.env.X` directamente — siempre `env.X`.

## Frontend (`app/`)

### Estado de autenticación

- Único origen de verdad: `AuthContext` (importar `useAuth()`).
- No duplicar estado de auth en componentes individuales.
- `AuthProvider` envuelve toda la app en `App.tsx`.

### Comunicación con API

- Toda llamada HTTP a través de `ApiClient` (`services/api.ts`).
- `request()` es privado — agregar métodos públicos con nombre semántico por endpoint.
- El token JWT se adjunta automáticamente en el método `request()` desde `Preferences`.
- `loginRequest()` usa `skipAuth: true` (no puede haber token antes del login).

### Navegación

- No hay router (no hay `useIonRouter`, no hay `IonRouterOutlet`).
- La navegación es mediante `view` state en `AppContent` (conditional rendering).
- `ViewKey` define todas las vistas posibles — agregar la nueva vista antes de usarla.

### Tipos

- Definidos en `types/domain.ts`.
- `PersonRole` para los roles del sistema.
- No crear tipos duplicados en componentes — reutilizar los de `domain.ts`.
