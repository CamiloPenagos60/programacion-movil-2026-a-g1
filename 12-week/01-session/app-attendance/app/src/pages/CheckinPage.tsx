import { useEffect, useRef, useState } from "react";
import {
  IonButton,
  IonIcon,
} from "@ionic/react";
import { alertCircleOutline, checkmarkCircleOutline, keyOutline, refreshOutline, schoolOutline } from "ionicons/icons";
import type { AttendanceSession, Institution } from "../types/domain";

const DIGITS = 6;

type CheckinPageProps = {
  institution: Institution | null;
  session: AttendanceSession | null;
  onCheckin: (roomCode: string) => Promise<void>;
  onRefresh: () => void;
  loading: boolean;
  result: { ok: boolean; message: string } | null;
  pendingQrToken?: string | null;
};

export function CheckinPage({ institution, session, onCheckin, onRefresh, loading, result, pendingQrToken }: CheckinPageProps) {
  const [digits, setDigits] = useState<string[]>(Array(DIGITS).fill(""));
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(DIGITS).fill(null));

  const code = digits.join("");
  // When arriving via QR scan, the qrToken identifies the session server-side — no need for local session state
  const canSubmit = code.length === DIGITS && !loading && (Boolean(pendingQrToken) || session?.status === "active");

  // Shake animation on error result
  useEffect(() => {
    if (result && !result.ok) {
      setShake(true);
      const t = window.setTimeout(() => setShake(false), 500);
      return () => window.clearTimeout(t);
    }
  }, [result]);

  function handleDigitChange(idx: number, e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(-1).toUpperCase();
    const next = [...digits];
    next[idx] = val;
    setDigits(next);
    if (val && idx < DIGITS - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[idx]) {
        const next = [...digits];
        next[idx] = "";
        setDigits(next);
      } else if (idx > 0) {
        inputRefs.current[idx - 1]?.focus();
      }
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, DIGITS);
    const next = Array(DIGITS).fill("") as string[];
    text.split("").forEach((c, i) => { next[i] = c; });
    setDigits(next);
    inputRefs.current[Math.min(text.length, DIGITS - 1)]?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    await onCheckin(code);
    setDigits(Array(DIGITS).fill(""));
    inputRefs.current[0]?.focus();
  }

  const statusBadgeClass = session?.status === "active" ? "badge-success" : "badge-neutral";
  const statusLabel = session?.status === "active" ? "Activa" : (session?.status ?? "Sin sesión");

  return (
    <section className="page-section">
      <div className="section-heading compact-row">
        <div>
          <h1>Registrar asistencia</h1>
          <p>{institution?.name ?? ""}</p>
        </div>
        <IonButton fill="clear" onClick={onRefresh} title="Actualizar sesión">
          <IonIcon icon={refreshOutline} slot="icon-only" />
        </IonButton>
      </div>

      {pendingQrToken && (
        <div className="qr-scanned-banner">
          <IonIcon icon={checkmarkCircleOutline} />
          <span>QR escaneado — ingresa el código de sala para confirmar tu asistencia.</span>
        </div>
      )}

      <div className="checkin-context">
        <div className="checkin-context-icon">
          <IonIcon icon={schoolOutline} />
        </div>
        <div className="checkin-context-body">
          <h3>{session?.unit?.name ?? (institution?.labels.unit ?? "Unidad académica")}</h3>
          <p>
            {pendingQrToken
              ? "QR verificado — ingresa el código de sala visible en pantalla."
              : session
                ? session.status === "active"
                  ? "Sesión activa — ingresa el código visible en la pantalla del docente"
                  : "Sesión no activa en este momento"
                : "No hay sesión activa. Solicita al docente que active el QR."}
          </p>
        </div>
      </div>

      <div className="session-info-panel">
        <div className="session-info-row">
          <span className="session-info-label">{institution?.labels.unit ?? "Unidad"}</span>
          <span className="session-info-value">{session?.unit?.name ?? "—"}</span>
        </div>
        <div className="session-info-row">
          <span className="session-info-label">Estado</span>
          <span className="session-info-value">
            <span className={`status-badge ${statusBadgeClass}`}>{statusLabel}</span>
          </span>
        </div>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} style={{ padding: "0 4px", marginTop: "8px" }}>
        <label className="otp-label">Código de sala</label>
        <div className={`otp-container${shake ? " otp-shake" : ""}`}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              className={`otp-box${d ? " otp-filled" : ""}`}
              type="text"
              inputMode="text"
              maxLength={1}
              value={d}
              onChange={(e) => handleDigitChange(i, e)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              disabled={loading}
              autoComplete="off"
            />
          ))}
        </div>
        <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-muted)", textAlign: "center", margin: "0 0 16px" }}>
          Ingresa el código de {DIGITS} caracteres visible en pantalla del docente
        </p>

        <IonButton expand="block" type="submit" disabled={!canSubmit}>
          <IonIcon icon={keyOutline} slot="start" />
          {loading ? "Registrando…" : "Confirmar asistencia"}
        </IonButton>
      </form>

      {result && (
        <div className={`result-banner ${result.ok ? "result-ok" : "result-fail"}`}>
          <IonIcon icon={result.ok ? checkmarkCircleOutline : alertCircleOutline} />
          <div>
            <strong style={{ display: "block", fontSize: "var(--font-size-md)", marginBottom: "2px" }}>
              {result.ok ? "¡Asistencia registrada!" : "No registrado"}
            </strong>
            <span style={{ fontSize: "var(--font-size-base)", lineHeight: 1.4 }}>{result.message}</span>
          </div>
        </div>
      )}
    </section>
  );
}
