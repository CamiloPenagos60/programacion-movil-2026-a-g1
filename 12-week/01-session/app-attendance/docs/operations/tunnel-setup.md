# Configuración con Túneles (ngrok, localtunnel, etc.)

## ¿Por qué usar túneles?

Los túneles permiten exponer tu aplicación local a Internet de forma temporal, lo cual es útil para:
- Probar la aplicación desde dispositivos móviles sin configurar red local
- Demostrar la aplicación a clientes remotos
- Realizar pruebas de escaneo QR desde cualquier lugar

## Opción 1: Un solo túnel para todo (Recomendado)

### 1. Instalar ngrok

```bash
# Windows con Chocolatey
choco install ngrok

# O descargar desde https://ngrok.com/download
```

### 2. Configurar ngrok con archivo de configuración

Crea un archivo `ngrok.yml`:

```yaml
version: 2
authtoken: TU_TOKEN_AQUI
tunnels:
  app:
    addr: 8080
    proto: http
  api:
    addr: 4000
    proto: http
```

### 3. Iniciar los túneles

```bash
ngrok start --all --config ngrok.yml
```

Obtendrás dos URLs:
- Frontend: `https://abc123.ngrok-free.app` → `localhost:8080`
- Backend: `https://def456.ngrok-free.app` → `localhost:4000`

### 4. Configurar la aplicación

Crea un archivo `.env` en la raíz del proyecto:

```env
# Copiar desde .env.example y agregar:
PUBLIC_BASE_URL=https://def456.ngrok-free.app
```

### 5. Reiniciar el backend

```bash
docker compose up -d api
```

### 6. Acceder desde tu navegador

1. Abre en tu navegador: `https://abc123.ngrok-free.app`
2. Configura el backend usando: `https://def456.ngrok-free.app`
3. Inicia sesión como instructor
4. Genera el QR - ¡ahora funcionará correctamente desde cualquier dispositivo!

## Opción 2: Túnel único con proxy inverso (Avanzado)

Si prefieres un solo túnel para todo, puedes usar nginx como proxy inverso:

### 1. Modificar nginx.conf del frontend

Agrega esta sección antes del bloque `location /`:

```nginx
# Proxy para el backend
location /api/ {
    proxy_pass http://api:4000/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_cache_bypass $http_upgrade;
}

# Endpoints públicos del backend
location /health {
    proxy_pass http://api:4000/health;
    proxy_set_header Host $host;
}

location /ready {
    proxy_pass http://api:4000/ready;
    proxy_set_header Host $host;
}

location /attendance/ {
    proxy_pass http://api:4000/attendance/;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
}
```

### 2. Reconstruir el frontend

```bash
docker compose build app
docker compose up -d app
```

### 3. Iniciar un solo túnel

```bash
ngrok http 8080
```

### 4. Configurar la variable de entorno

En `.env`:

```env
PUBLIC_BASE_URL=https://abc123.ngrok-free.app
```

### 5. Reiniciar el backend

```bash
docker compose up -d api
```

Ahora todo funcionará a través de una sola URL de ngrok.

## Alternativas a ngrok

### localtunnel (Gratis, sin registro)

```bash
npm install -g localtunnel

# Frontend
lt --port 8080 --subdomain mi-app

# Backend (en otra terminal)
lt --port 4000 --subdomain mi-app-api
```

### CloudFlare Tunnel (Gratis, requiere cuenta)

```bash
cloudflared tunnel --url http://localhost:8080
```

## Solución de Problemas

### El QR no funciona después de escanearlo

**Causa:** La URL del QR apunta a localhost en lugar del túnel.

**Solución:** Asegúrate de que:
1. La variable `PUBLIC_BASE_URL` está configurada correctamente en `.env`
2. El backend se reinició después de configurar la variable
3. El túnel está activo cuando generas el QR

### Error "ERR_CONNECTION_REFUSED" en el móvil

**Causa:** El túnel no está activo o la URL es incorrecta.

**Solución:**
1. Verifica que el túnel esté corriendo: `ngrok http 8080`
2. Copia la URL HTTPS que muestra ngrok (no http)
3. Usa esa URL en el navegador del móvil

### El QR genera una URL de localhost

**Causa:** La variable `PUBLIC_BASE_URL` no está configurada.

**Solución:**
1. Edita el archivo `.env` en la raíz del proyecto
2. Agrega: `PUBLIC_BASE_URL=https://tu-tunel.ngrok-free.app`
3. Reinicia el backend: `docker compose restart api`

## Verificar la configuración

```bash
# Ver la configuración actual del backend
docker logs app-attendance-api --tail 20

# Verificar que PUBLIC_BASE_URL está configurada
docker exec app-attendance-api sh -c 'echo $PUBLIC_BASE_URL'

# Probar el health endpoint
curl http://localhost:4000/health
```

## Seguridad

⚠️ **IMPORTANTE:** Los túneles exponen tu aplicación a Internet. Para uso en producción:

1. Usa contraseñas seguras en `JWT_SECRET`
2. No uses túneles para datos sensibles en producción
3. Cierra el túnel cuando no lo necesites
4. Considera usar autenticación adicional en ngrok (plan de pago)

## Flujo de Trabajo Típico

1. **Desarrollador/Instructor:**
   - Inicia Docker Compose localmente
   - Inicia el túnel de ngrok
   - Accede a través de la URL del túnel
   - Genera el QR para la sesión

2. **Estudiante:**
   - Escanea el QR desde su móvil
   - Se redirige automáticamente a la URL del túnel
   - Inicia sesión y registra su asistencia
   - Todo funciona sin configuración adicional

¡Listo! Ahora puedes usar la aplicación de asistencia desde cualquier lugar.
