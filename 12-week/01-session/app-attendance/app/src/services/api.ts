import type {
  AcademicUnit,
  AttendanceRecord,
  AttendanceSession,
  BackendStatus,
  Institution,
  Person,
  RoomCode
} from "../types/domain";
import { getAuthToken } from "./preferences";

type ApiEnvelope<T> = { data: T };
type ReadyResponse = { status: string; mongo: string; institutions: number };

export class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = sanitizeBaseUrl(baseUrl);
  }

  async validate(): Promise<BackendStatus> {
    try {
      const health = await this.request<{ status: string }>("/health", { rawPath: true });
      const ready = await this.request<ReadyResponse>("/ready", { rawPath: true });
      return {
        valid: health.status === "ok" && ready.status === "ready",
        health: health.status === "ok",
        ready: ready.status === "ready",
        message: ready.mongo === "connected" ? "Backend y MongoDB disponibles." : "MongoDB no esta listo.",
        institutions: ready.institutions
      };
    } catch (error) {
      return {
        valid: false,
        health: false,
        ready: false,
        message: error instanceof Error ? error.message : "No fue posible validar el backend."
      };
    }
  }

  async institutions(): Promise<Institution[]> {
    return this.requestData<Institution[]>("/institutions");
  }

  async units(institutionId: string): Promise<AcademicUnit[]> {
    return this.requestData<AcademicUnit[]>(`/institutions/${institutionId}/units`);
  }

  async people(unitId: string): Promise<Person[]> {
    return this.requestData<Person[]>(`/units/${unitId}/people`);
  }

  async createSession(input: { institutionId: string; unitId: string; qrTtlMinutes?: number }): Promise<AttendanceSession> {
    return this.requestData<AttendanceSession>("/sessions", { method: "POST", body: input });
  }

  async activateSession(sessionId: string): Promise<AttendanceSession> {
    return this.requestData<AttendanceSession>(`/sessions/${sessionId}/activate`, { method: "POST" });
  }

  async closeSession(sessionId: string): Promise<AttendanceSession> {
    return this.requestData<AttendanceSession>(`/sessions/${sessionId}/close`, { method: "POST" });
  }

  async session(sessionId: string): Promise<AttendanceSession> {
    return this.requestData<AttendanceSession>(`/sessions/${sessionId}`);
  }

  async present(sessionId: string): Promise<AttendanceRecord[]> {
    return this.requestData<AttendanceRecord[]>(`/sessions/${sessionId}/present`);
  }

  async absent(sessionId: string): Promise<Person[]> {
    return this.requestData<Person[]>(`/sessions/${sessionId}/absent`);
  }

  async rejections(sessionId: string): Promise<AttendanceRecord[]> {
    return this.requestData<AttendanceRecord[]>(`/sessions/${sessionId}/rejections`);
  }

  async sessions(filters: { institutionId?: string; unitId?: string } = {}): Promise<AttendanceSession[]> {
    const params = new URLSearchParams();
    if (filters.institutionId) params.set("institutionId", filters.institutionId);
    if (filters.unitId) params.set("unitId", filters.unitId);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return this.requestData<AttendanceSession[]>(`/sessions${suffix}`);
  }

  async getRoomCode(sessionId: string): Promise<RoomCode> {
    return this.requestData<RoomCode>(`/sessions/${sessionId}/room-code`);
  }

  /** Get a short-lived ephemeral QR token (docente/instructor only). */
  async getEphemeralQrToken(sessionId: string): Promise<{ attendanceUrl: string; expiresAt: string; ttlSeconds: number }> {
    const raw = await this.requestData<{ attendanceUrl: string; expiresAt: string; ttlSeconds: number }>(
      `/sessions/${sessionId}/qr-token`
    );
    // Obtener la URL pública del frontend (para túneles)
    // @ts-ignore - VITE_PUBLIC_FRONTEND_URL es una variable de entorno opcional
    const publicFrontendUrl = import.meta.env?.VITE_PUBLIC_FRONTEND_URL || "";
    
    // Si el backend ya generó una URL completa con túnel (PUBLIC_BASE_URL), solo agregar el parámetro api
    try {
      const backendOrigin = new URL(this.baseUrl).origin;
      const attendanceUrl = new URL(raw.attendanceUrl);
      
      // Si la URL del backend apunta a un dominio público (túnel), usarla tal cual
      // Solo agregar el parámetro ?api= para que el móvil sepa dónde está el backend
      if (!attendanceUrl.hostname.includes('localhost') && 
          !attendanceUrl.hostname.includes('127.0.0.1') &&
          !attendanceUrl.hostname.includes('0.0.0.0')) {
        // URL del túnel - conservarla y solo agregar ?api=
        attendanceUrl.searchParams.set('api', backendOrigin);
        return { ...raw, attendanceUrl: attendanceUrl.toString() };
      }
      
      // Si es localhost y hay una URL pública del frontend configurada, usarla
      const scanPath = attendanceUrl.pathname;
      const frontendOrigin = publicFrontendUrl || window.location.origin;
      const frontendUrl = `${frontendOrigin}${scanPath}?api=${encodeURIComponent(backendOrigin)}`;
      return { ...raw, attendanceUrl: frontendUrl };
    } catch {
      return raw; // fallback: return as-is if URL parsing fails
    }
  }

  /** Validate a scanned ephemeral QR token (public, no auth). */
  async scanQrToken(qrToken: string): Promise<{
    valid: boolean; code: string; message: string; qrToken?: string;
    expiresAt?: string; requiresAuth?: boolean;
    session?: { id: string; institutionName?: unknown; unitName?: unknown };
  }> {
    const url = `${this.baseUrl}/attendance/scan/${encodeURIComponent(qrToken)}`;
    const response = await fetch(url);
    const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
    if (!response.ok) {
      const errPayload = payload as { error?: { code?: string; message?: string } } | null;
      const msg = errPayload?.error?.message ?? "QR expirado o no válido.";
      const code = errPayload?.error?.code ?? "TOKEN_EXPIRED";
      return { valid: false, code, message: msg };
    }
    return (payload as { data: { valid: boolean; code: string; message: string; qrToken?: string; expiresAt?: string; requiresAuth?: boolean; session?: { id: string } } }).data;
  }

  async checkin(sessionId: string, roomCode: string, qrToken?: string): Promise<{ accepted: boolean; message: string }> {
    const body: Record<string, string> = { roomCode };
    // Prefer sessionId when available — qrToken expires in 20s but sessionId persists.
    // Only fall back to qrToken when there is no valid sessionId.
    const hasValidSessionId = sessionId && sessionId.trim() !== "";
    
    if (hasValidSessionId) {
      body.sessionId = sessionId;
    } else if (qrToken) {
      body.qrToken = qrToken;
    } else {
      // If neither is available, send empty sessionId to get a proper error from backend
      body.sessionId = sessionId || "";
    }
    
    return this.requestData<{ accepted: boolean; message: string }>("/attendance/checkin", {
      method: "POST",
      body,
    });
  }

  async activeSessionForInstitution(institutionId: string): Promise<AttendanceSession | null> {
    const sessions = await this.sessions({ institutionId });
    return sessions.find((s) => s.status === "active") ?? null;
  }

  attendanceUrl(session: AttendanceSession): string | null {
    if (session.attendanceUrl) return session.attendanceUrl;
    if (session.qrToken) return `${this.baseUrl}/attendance/${session.qrToken}`;
    return null;
  }

  /** Login — public endpoint, called before the JWT token is available. */
  async loginRequest(credentials: { documento: string; password: string }): Promise<{
    data: { token: string; person: { id: string; institutionId: string; documento: string; nombre: string; roles: string[] } };
  }> {
    return this.request("/auth/login", { method: "POST", body: credentials, rawPath: false, skipAuth: true });
  }

  /** Extracts `.data` from the standard API envelope. Avoids repeating the pattern on every method. */
  private async requestData<T>(
    path: string,
    options: { method?: string; body?: unknown; rawPath?: boolean; skipAuth?: boolean } = {}
  ): Promise<T> {
    return (await this.request<ApiEnvelope<T>>(path, options)).data;
  }

  private async request<T>(
    path: string,
    options: { method?: string; body?: unknown; rawPath?: boolean; skipAuth?: boolean } = {}
  ): Promise<T> {
    const url = options.rawPath ? `${this.baseUrl}${path}` : `${this.baseUrl}/api${path}`;

    // Obtener el token de autenticación
    const token = options.skipAuth ? null : await getAuthToken();

    // Preparar las cabeceras
    const headers: Record<string, string> = {};
    if (options.body) {
      headers["Content-Type"] = "application/json";
    }
    // Incluir el token en la cabecera si existe
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const payload = (await response.json().catch(() => null)) as unknown;
    if (!response.ok) {
      throw new Error(extractError(payload) ?? `Error HTTP ${response.status}`);
    }
    return payload as T;
  }
}

export function sanitizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

function extractError(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || !("error" in payload)) return null;
  const error = (payload as { error?: { message?: string } }).error;
  return error?.message ?? null;
}


