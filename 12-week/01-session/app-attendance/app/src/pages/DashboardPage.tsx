import { IonIcon } from "@ionic/react";
import {
  clipboardOutline,
  listOutline,
  peopleOutline,
  qrCodeOutline,
  timeOutline,
  warningOutline,
} from "ionicons/icons";
import { MetricGrid } from "../components/MetricGrid";
import type { AcademicUnit, AttendanceSession, Institution, Person } from "../types/domain";

type DashboardPageProps = {
  institution: Institution;
  unit: AcademicUnit | null;
  people: Person[];
  session: AttendanceSession | null;
  onNavigate: (view: "units" | "people" | "session" | "results" | "history") => void;
};

function sessionVariant(status: string | undefined) {
  if (status === "active") return "success" as const;
  if (status === "closed" || status === "expired") return "neutral" as const;
  return undefined;
}

function sessionLabel(status: string | undefined) {
  if (!status) return "Sin sesión";
  if (status === "active") return "Activa";
  if (status === "closed") return "Cerrada";
  if (status === "expired") return "Expirada";
  return status;
}

export function DashboardPage({ institution, unit, people, session, onNavigate }: DashboardPageProps) {
  const sessionActive = session?.status === "active";
  return (
    <section className="page-section">
      <div className="hero-panel">
        <div style={{ flex: 1, minWidth: 0 }}>
          <span className="hero-eyebrow">{institution.labels.role}</span>
          <h1 style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{institution.name}</h1>
          <p>{unit ? `${institution.labels.unit}: ${unit.code} — ${unit.name}` : `${institution.labels.unit} pendiente`}</p>
          <div className={`hero-session-status ${sessionActive ? "active" : "inactive"}`}>
            <span className="hero-status-dot" />
            {session ? (sessionActive ? "Sesión activa" : sessionLabel(session.status)) : "Sin sesión"}
          </div>
        </div>
        <strong className="hero-code">
          {institution.code}
        </strong>
      </div>

      <MetricGrid
        metrics={[
          { label: institution.labels.people, value: people.length },
          { label: "Sesión", value: sessionLabel(session?.status), variant: sessionVariant(session?.status) },
          { label: "QR min", value: institution.qr.ttlMinutes },
        ]}
      />

      {!unit && (
        <div className="unit-warning">
          <IonIcon icon={warningOutline} />
          Selecciona una {institution.labels.unit.toLowerCase()} para continuar
        </div>
      )}

      <div className="action-grid">
        <button className="action-card action-card-accent-blue" onClick={() => onNavigate("units")}>
          <div className="action-icon"><IonIcon icon={listOutline} /></div>
          <strong>{institution.labels.unit}</strong>
          <small>Selecciona la unidad activa</small>
        </button>
        <button className="action-card action-card-accent-green" onClick={() => onNavigate("people")} disabled={!unit}>
          <div className="action-icon"><IonIcon icon={peopleOutline} /></div>
          <strong>{institution.labels.people}</strong>
          <small>Listado de inscritos</small>
        </button>
        <button className="action-card action-card-accent-violet" onClick={() => onNavigate("session")} disabled={!unit}>
          <div className="action-icon"><IonIcon icon={qrCodeOutline} /></div>
          <strong>Sesión QR</strong>
          <small>Crea y activa el QR de asistencia</small>
        </button>
        <button className="action-card action-card-accent-teal" onClick={() => onNavigate("results")} disabled={!session}>
          <div className="action-icon"><IonIcon icon={clipboardOutline} /></div>
          <strong>Resultados</strong>
          <small>Presentes, ausentes y rechazos</small>
        </button>
        <button className="action-card action-card-accent-orange" onClick={() => onNavigate("history")}>
          <div className="action-icon"><IonIcon icon={timeOutline} /></div>
          <strong>Historial</strong>
          <small>Sesiones anteriores</small>
        </button>
      </div>
    </section>
  );
}

