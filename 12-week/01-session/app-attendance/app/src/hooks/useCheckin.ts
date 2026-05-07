import { useState } from "react";
import type { ApiClient } from "../services/api";
import type { AttendanceSession, Institution, ViewKey } from "../types/domain";
import { clearPendingQrToken, clearPendingSessionId } from "../services/preferences";

type Args = {
  api: ApiClient | null;
  institution: Institution | null;
  setView: (view: ViewKey) => void;
  runTask: <T>(label: string, task: () => Promise<T>) => Promise<T | null>;
  setLoading: (msg: string) => void;
  pendingQrToken?: string | null;
};

/**
 * Owns student self-checkin state and operations.
 * submitCheckin handles its own loading/error to set checkinResult on both outcomes.
 */
export function useCheckin({ api, institution, setView, runTask, setLoading, pendingQrToken }: Args) {
  const [checkinSession, setCheckinSession] = useState<AttendanceSession | null>(null);
  const [checkinResult, setCheckinResult] = useState<{ ok: boolean; message: string } | null>(null);

  function resetCheckin() {
    setCheckinSession(null);
    setCheckinResult(null);
  }

  async function openCheckin() {
    if (!api || !institution) return;
    setCheckinResult(null);
    await runTask("Buscando sesion activa", async () => {
      const active = await api.activeSessionForInstitution(institution.id);
      setCheckinSession(active);
    });
    setView("checkin");
  }

  async function submitCheckin(code: string) {
    if (!api) return;
    setLoading("Registrando asistencia…");
    try {
      const sessionId = checkinSession?.id ?? "";
      const result = await api.checkin(sessionId, code, pendingQrToken ?? undefined);
      setCheckinResult({ ok: result.accepted, message: result.message });
      if (result.accepted) {
        await clearPendingQrToken();
        await clearPendingSessionId();
      }
    } catch (e) {
      setCheckinResult({ ok: false, message: e instanceof Error ? e.message : "Error al registrar." });
    } finally {
      setLoading("");
    }
  }

  return {
    checkinSession,
    setCheckinSession,
    checkinResult,
    resetCheckin,
    openCheckin,
    submitCheckin,
  };
}
