import { useState } from "react";
import {
  IonButton,
  IonIcon,
  IonLabel,
  IonList,
  IonSegment,
  IonSegmentButton,
} from "@ionic/react";
import { cloudDownloadOutline, refreshOutline } from "ionicons/icons";
import { EmptyState } from "../components/EmptyState";
import { MetricGrid } from "../components/MetricGrid";
import { PersonRows } from "../components/PersonRows";
import { RejectionRows } from "../components/RejectionRows";
import { useAutoRefresh } from "../hooks/useAutoRefresh";
import type { AttendanceRecord, AttendanceSession, Institution, Person } from "../types/domain";
import { exportAttendanceReport } from "../services/excel-export";

type ResultsPageProps = {
  institution: Institution;
  session: AttendanceSession | null;
  present: AttendanceRecord[];
  absent: Person[];
  rejections: AttendanceRecord[];
  onRefresh: () => void;
};

type Segment = "present" | "absent" | "rejections";

export function ResultsPage({ institution, session, present, absent, rejections, onRefresh }: ResultsPageProps) {
  const [segment, setSegment] = useState<Segment>("present");

  useAutoRefresh(session?.status === "active", 10000, onRefresh);

  const total = present.length + absent.length;
  const attendancePct = total > 0 ? Math.round((present.length / total) * 100) : 0;

  return (
    <section className="page-section">
      <div className="section-heading compact-row">
        <div>
          <h1>Resultados</h1>
          <p>{institution.labels.role}</p>
        </div>
        <IonButton fill="clear" onClick={onRefresh} disabled={!session} title="Actualizar">
          <IonIcon icon={refreshOutline} slot="icon-only" />
        </IonButton>
      </div>

      {!session ? (
        <EmptyState title="Sesión pendiente" detail="Crea y activa una sesión para ver resultados." />
      ) : (
        <>
          <MetricGrid
            metrics={[
              { label: "Presentes", value: present.length, variant: "success" },
              { label: "Ausentes", value: absent.length, variant: "danger" },
              { label: "Rechazados", value: rejections.length, variant: "warning" },
            ]}
          />

          {total > 0 && (
            <div className="attendance-progress">
              <div className="attendance-progress-bar-bg">
                <div className="attendance-progress-bar-fill" style={{ width: `${attendancePct}%` }} />
              </div>
              <span className="attendance-progress-label">{attendancePct}% de asistencia</span>
            </div>
          )}

          <div className="export-btn-wrap">
            <IonButton
              expand="block"
              onClick={() => exportAttendanceReport({ institution, session: session!, present, absent, rejections })}
              disabled={!session}
            >
              <IonIcon icon={cloudDownloadOutline} slot="start" />
              Exportar Excel
            </IonButton>
          </div>

          <IonSegment value={segment} onIonChange={(event) => setSegment(String(event.detail.value) as Segment)}>
            <IonSegmentButton value="present">
              <IonLabel>Presentes ({present.length})</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="absent">
              <IonLabel>Ausentes ({absent.length})</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="rejections">
              <IonLabel>Rechazos ({rejections.length})</IonLabel>
            </IonSegmentButton>
          </IonSegment>

          {segment === "present" ? (
            present.length === 0 ? (
              <EmptyState title="Sin presentes aún" />
            ) : (
              <IonList inset>
                <PersonRows people={present.map((r) => r.person).filter(Boolean) as Person[]} />
              </IonList>
            )
          ) : null}

          {segment === "absent" ? (
            absent.length === 0 ? (
              <EmptyState title="Sin ausentes" />
            ) : (
              <IonList inset>
                <PersonRows people={absent} />
              </IonList>
            )
          ) : null}

          {segment === "rejections" ? (
            rejections.length === 0 ? (
              <EmptyState title="Sin rechazos" />
            ) : (
              <IonList inset>
                <RejectionRows records={rejections} />
              </IonList>
            )
          ) : null}
        </>
      )}
    </section>
  );
}

