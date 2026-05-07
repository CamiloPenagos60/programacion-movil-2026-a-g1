# ── build ─────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS build

# Argumento para la URL pública del frontend (túneles como ngrok)
ARG VITE_PUBLIC_FRONTEND_URL=""

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --ignore-scripts

COPY . .

# Pasar el ARG como variable de entorno para Vite
ENV VITE_PUBLIC_FRONTEND_URL=$VITE_PUBLIC_FRONTEND_URL

RUN npm run build

# ── serve ─────────────────────────────────────────────────────────────────────
FROM nginx:stable-alpine AS serve

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
