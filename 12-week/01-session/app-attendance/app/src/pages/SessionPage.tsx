import {
  IonButton,
  IonIcon,
} from "@ionic/react";
import { closeCircleOutline, playCircleOutline, qrCodeOutline, refreshOutline } from "ionicons/icons";
import { QRCodeSVG } from "qrcode.react";
import { EmptyState } from "../components/EmptyState";
import { useRoomCodeCountdown } from "../hooks/useRoomCodeCountdown";
import { useAutoRefresh } from "../hooks/useAutoRefresh";
import type { AcademicUnit, AttendanceSession, EphemeralQrInfo, Institution, RoomCode } from "../types/domain";

type SessionPageProps = {
  institution: Institution;
  unit: AcademicUnit | null;
  session: AttendanceSession | null;
  qrUrl: string | null;
  roomCode: RoomCode | null;
  ephemeralQrInfo: EphemeralQrInfo | null;
  onCreate: () => void;
  onActivate: () => void;
  onClose: () => void;
  onRefresh: () => void;
  onRefreshRoomCode: () => void;
  onRefreshQrToken: () => void;
};

type StepState = "done" | "current" | "pending";

function stepState(step: 1 | 2 | 3, session: AttendanceSession | null): StepState {
  if (step === 1) return session ? "done" : "current";
  if (step === 2) {
    if (!session) return "pending";
    return session.status === "active" ? "done" : "current";
  }
  if (!session) return "pending";
  if (session.status === "active") return "current";
  if (session.status === "closed") return "done";
  return "pending";
}

export function SessionPage({
  institution,
  unit,
  session,
  qrUrl,
  roomCode,
  ephemeralQrInfo,
  onCreate,
  onActivate,
  onClose,
  onRefresh,
  onRefreshRoomCode,
  onRefreshQrToken,
}: SessionPageProps) {
  const active = session?.status === "active" && Boolean(qrUrl);
  const secsLeft = useRoomCodeCountdown(roomCode, active, onRefreshRoomCode);

  // Auto-refresh ephemeral QR token before it expires
  const qrRefreshMs = ephemeralQrInfo ? Math.max(5, (ephemeralQrInfo.ttlSeconds - 3)) * 1000 : 20000;
  useAutoRefresh(active, qrRefreshMs, onRefreshQrToken);

  // The QR to display: ephemeral URL if available, otherwise fall back to static
  const displayQrUrl = ephemeralQrInfo?.attendanceUrl ?? qrUrl;

  // Use roomCode.ttlSeconds to compute progress bar %
  const countdownPct = roomCode && roomCode.ttlSeconds > 0
    ? Math.max(0, Math.round(secsLeft / roomCode.ttlSeconds * 100))
    : 0;

  function copyUrl() {
    if (displayQrUrl) void navigator.clipboard.writeText(displayQrUrl);
  }

  const stepLabels = ["Crear", "Activar", "Cerrar"];

  return (
    <section className="page-section">
      <div className="section-heading compact-row">
        <div>
          <h1>Sesión QR</h1>
          <p>{unit ? `${institution.labels.unit}: ${unit.code}` : institution.labels.unit}</p>
        </div>
        <IonButton fill="clear" onClick={onRefresh} disabled={!session}>
          <IonIcon icon={refreshOutline} slot="icon-only" />
        </IonButton>
      </div>

      {!unit ? (
        <EmptyState
          title={`${institution.labels.unit} pendiente`}
          detail="Selecciona una unidad desde el dashboard."
        />
      ) : (
        <>
          {/* Session stepper */}
          <div className="session-stepper">
            {([1, 2, 3] as const).map((step, idx) => {
              const state = stepState(step, session);
              return (
                <div key={step} className={`stepper-step ${state}`}>
                  <div className="stepper-dot">{state === "done" ? "✓" : step}</div>
                  <span className="stepper-label">{stepLabels[idx]}</span>
                </div>
              );
            })}
          </div>

          <div className="button-row">
            <IonButton
              expand="block"
              onClick={onCreate}
              disabled={session?.status === "active"}
              fill={stepState(1, session) === "current" ? "solid" : "outline"}
            >
              <IonIcon icon={qrCodeOutline} slot="start" />
              Crear
            </IonButton>
            <IonButton
              expand="block"
              onClick={onActivate}
              disabled={!session || session.status === "active" || session.status === "closed"}
              fill={stepState(2, session) === "current" ? "solid" : "outline"}
            >
              <IonIcon icon={playCircleOutline} slot="start" />
              Activar QR
            </IonButton>
          </div>

          {active ? (
            <div className="qr-panel" style={{ marginTop: "16px" }}>
              {roomCode && (
                <div className="room-code-card">
                  <p className="room-code-label">Código de sala</p>
                  <div className="room-code-boxes">
                    {roomCode.code.split("").map((char, i) => (
                      <span key={i} className="room-code-box">{char}</span>
                    ))}
                  </div>
                  <div className="room-code-countdown-bar">
                    <div className="room-code-progress" style={{ width: `${countdownPct}%` }} />
                  </div>
                  <p className="room-code-hint">
                    Estudiantes ingresan este código en la app · {secsLeft}s restantes
                  </p>
                </div>
              )}
              {ephemeralQrInfo && (
                <p className="qr-anti-screenshot-hint">
                  ⚠️ El QR cambia automáticamente cada {ephemeralQrInfo.ttlSeconds}s. Las capturas antiguas no son válidas.
                </p>
              )}
              <div className="qr-frame">
                <QRCodeSVG value={displayQrUrl ?? ""} size={200} level="M" includeMargin={false} />
              </div>
              <button className="qr-url-chip" onClick={copyUrl} title="Copiar URL">
                {displayQrUrl}
              </button>
            </div>
          ) : (
            session ? (
              <EmptyState title="QR inactivo" detail="Activa la sesión para generar el código QR temporal." />
            ) : (
              <EmptyState title="Sin sesión" detail="Crea y activa una sesión para generar el QR." />
            )
          )}

          <IonButton
            expand="block"
            color="danger"
            fill={stepState(3, session) === "current" ? "solid" : "outline"}
            onClick={onClose}
            disabled={!session || session.status === "closed"}
            style={{ marginTop: "16px" }}
          >
            <IonIcon icon={closeCircleOutline} slot="start" />
            Cerrar sesión
          </IonButton>
        </>
      )}
    </section>
  );
}

