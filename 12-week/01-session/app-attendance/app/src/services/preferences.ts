import { Preferences } from "@capacitor/preferences";
import type { AuthUser } from "../types/domain";

const BACKEND_URL_KEY = "app-attendance.backend-url";
const AUTH_TOKEN_KEY = "app-attendance.auth-token";
const AUTH_USER_KEY = "app-attendance.auth-user";
const PENDING_QR_TOKEN_KEY = "app-attendance.pending-qr-token";

export async function getSavedBackendUrl(): Promise<string> {
  const { value } = await Preferences.get({ key: BACKEND_URL_KEY });
  return value ?? "";
}

export async function saveBackendUrl(url: string): Promise<void> {
  await Preferences.set({ key: BACKEND_URL_KEY, value: url });
}

export async function getAuthToken(): Promise<string | null> {
  const { value } = await Preferences.get({ key: AUTH_TOKEN_KEY });
  return value;
}

export async function saveAuthToken(token: string): Promise<void> {
  await Preferences.set({ key: AUTH_TOKEN_KEY, value: token });
}

export async function clearAuthToken(): Promise<void> {
  await Preferences.remove({ key: AUTH_TOKEN_KEY });
  await Preferences.remove({ key: AUTH_USER_KEY });
}

export async function saveAuthUser(user: AuthUser): Promise<void> {
  await Preferences.set({ key: AUTH_USER_KEY, value: JSON.stringify(user) });
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const { value } = await Preferences.get({ key: AUTH_USER_KEY });
  if (!value) return null;
  return JSON.parse(value) as AuthUser;
}

export async function savePendingQrToken(token: string): Promise<void> {
  await Preferences.set({ key: PENDING_QR_TOKEN_KEY, value: token });
}

export async function getPendingQrToken(): Promise<string | null> {
  const { value } = await Preferences.get({ key: PENDING_QR_TOKEN_KEY });
  return value ?? null;
}

export async function clearPendingQrToken(): Promise<void> {
  await Preferences.remove({ key: PENDING_QR_TOKEN_KEY });
}

const PENDING_SESSION_ID_KEY = "app-attendance.pending-session-id";

export async function savePendingSessionId(id: string): Promise<void> {
  await Preferences.set({ key: PENDING_SESSION_ID_KEY, value: id });
}

export async function getPendingSessionId(): Promise<string | null> {
  const { value } = await Preferences.get({ key: PENDING_SESSION_ID_KEY });
  return value ?? null;
}

export async function clearPendingSessionId(): Promise<void> {
  await Preferences.remove({ key: PENDING_SESSION_ID_KEY });
}

