# MongoDB Local

Esta carpeta esta reservada para datos locales de MongoDB si se decide usar un montaje directo del host.

La configuracion actual de `docker-compose.yml` usa un volumen nombrado de Docker:

```text
app-attendance_app_attendance_mongo_data
```

Por eso esta carpeta puede verse vacia aunque MongoDB este corriendo y tenga datos cargados.
