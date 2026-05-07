import type { Request } from "express";
import { env } from "../config/env";

export function requestBaseUrl(req: Request): string {
  // Si hay una URL pública configurada (para túneles como ngrok), usarla siempre
  if (env.PUBLIC_BASE_URL && env.PUBLIC_BASE_URL.trim() !== "") {
    return env.PUBLIC_BASE_URL.trim();
  }
  
  // De lo contrario, construir la URL desde los headers de la request
  const proto = String(req.headers["x-forwarded-proto"] || req.protocol).split(",")[0].trim();
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  return `${proto}://${host}`;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

