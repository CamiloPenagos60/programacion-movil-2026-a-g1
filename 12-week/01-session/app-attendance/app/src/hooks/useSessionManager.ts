import { useState } from "react";
import type { ApiClient } from "../services/api";
import type {
  AcademicUnit,
  AttendanceRecord,
  AttendanceSession,
  EphemeralQrInfo,
  Institution,
  Person,
  RoomCode,
} from "../types/domain";

type Args = {
  api: ApiClient | null;
  institution: Institution | null;
  selectedUnit: AcademicUnit | null;
  runTask: <T>(label: string, task: () => Promise<T>) => Promise<T | null>;
  setToast: (msg: string) => void;
};

/**
 * Owns session lifecycle state and operations:
 * create / activate / close / refresh session, attendance results, and room code.
 */
export function useSessionManager({ api, institution, selectedUnit, runTask, setToast }: Args) {
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [present, setPresent] = useState<AttendanceRecord[]>([]);
  const [absent, setAbsent] = useState<Person[]>([]);
  const [rejections, setRejections] = useState<AttendanceRecord[]>([]);
  const [roomCode, setRoomCode] = useState<RoomCode | null>(null);
  const [ephemeralQrInfo, setEphemeralQrInfo] = useState<EphemeralQrInfo | null>(null);

  function resetSession() {
    setSession(null);
    setPresent([]);
    setAbsent([]);
    setRejections([]);
    setRoomCode(null);
    setEphemeralQrInfo(null);
  }

  async function refreshResults(target?: AttendanceSession) {
    const t = target ?? session;
    if (!api || !t) return;
    const data = await runTask("Actualizando resultados", async () => {
      const [nextSession, nextPresent, nextAbsent, nextRejections] = await Promise.all([
        api.session(t.id),
        api.present(t.id),
        api.absent(t.id),
        api.rejections(t.id),
      ]);
      return { nextSession, nextPresent, nextAbsent, nextRejections };
    });
    if (!data) return;
    setSession(data.nextSession);
    setPresent(data.nextPresent);
    setAbsent(data.nextAbsent);
    setRejections(data.nextRejections);
  }

  async function createSession() {
    if (!api || !institution || !selectedUnit) return;
    const data = await runTask("Creando sesion", () =>
      api.createSession({
        institutionId: institution.id,
        unitId: selectedUnit.id,
        qrTtlMinutes: institution.qr.ttlMinutes,
      })
    );
    if (data) {
      setSession(data);
      setToast("Sesion creada.");
    }
  }

  async function activateSession() {
    if (!api || !session) return;
    const data = await runTask("Activando QR", () => api.activateSession(session.id));
    if (data) {
      setSession(data);
      setToast("QR activo.");
      await refreshResults(data);
      if (data.status === "active") {
        try {
          const rc = await api.getRoomCode(data.id);
          setRoomCode(rc);
        } catch { /* best-effort */ }
        try {
          const qi = await api.getEphemeralQrToken(data.id);
          setEphemeralQrInfo(qi);
        } catch { /* best-effort */ }
      }
    }
  }

  async function closeSession() {
    if (!api || !session) return;
    const data = await runTask("Cerrando sesion", () => api.closeSession(session.id));
    if (data) {
      setSession(data);
      setToast("Sesion cerrada.");
      await refreshResults(data);
    }
  }

  async function refreshCurrentSession() {
    if (!api || !session) return;
    const data = await runTask("Actualizando sesion", () => api.session(session.id));
    if (data) {
      setSession(data);
      await refreshResults(data);
    }
  }

  async function loadRoomCode() {
    if (!api || !session?.id || session.status !== "active") return;
    try {
      const rc = await api.getRoomCode(session.id);
      setRoomCode(rc);
    } catch { /* best-effort */ }
  }

  async function loadEphemeralQrToken(targetSession?: AttendanceSession) {
    const s = targetSession ?? session;
    if (!api || !s?.id || s.status !== "active") return;
    try {
      const info = await api.getEphemeralQrToken(s.id);
      setEphemeralQrInfo(info);
    } catch { /* best-effort */ }
  }

  return {
    session,
    setSession,
    present,
    absent,
    rejections,
    roomCode,
    ephemeralQrInfo,
    resetSession,
    createSession,
    activateSession,
    closeSession,
    refreshCurrentSession,
    refreshResults,
    loadRoomCode,
    loadEphemeralQrToken,
  };
}
