import { IonButton, IonIcon, IonItem, IonLabel, IonList } from "@ionic/react";
import { chevronForwardOutline, cloudDownloadOutline, refreshOutline, timeOutline } from "ionicons/icons";
import { EmptyState } from "../components/EmptyState";
import type { AttendanceSession, Institution } from "../types/domain";

type HistoryPageProps = {
  institution: Institution | null;
  sessions: AttendanceSession[];
  onRefresh: () => void;
  onSelect: (session: AttendanceSession) => void;
  onExportReport?: () => void;
  exportingReport?: boolean;
};

function sessionBadge(status: string) {
  if (status === "active") return { cls: "badge-success", label: "Activa" };
  if (status === "closed") return { cls: "badge-neutral", label: "Cerrada" };
  if (status === "expired") return { cls: "badge-warning", label: "Expirada" };
  return { cls: "badge-neutral", label: status };
}

function formatDate(dateStr: string | undefined | Date): string {
  if (!dateStr) return "Fecha desconocida";
  const date = new Date(String(dateStr));
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);
  const time = date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  if (date >= todayStart) return `Hoy ${time}`;
  if (date >= yesterdayStart) return `Ayer ${time}`;
  return date.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

function groupByDate(sessions: AttendanceSession[]): { label: string; items: AttendanceSession[] }[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(todayStart.getTime() - 6 * 86_400_000);

  const today: AttendanceSession[] = [];
  const thisWeek: AttendanceSession[] = [];
  const older: AttendanceSession[] = [];

  for (const s of sessions) {
    const d = new Date(String(s.createdAt));
    if (d >= todayStart) today.push(s);
    else if (d >= weekAgo) thisWeek.push(s);
    else older.push(s);
  }

  const groups: { label: string; items: AttendanceSession[] }[] = [];
  if (today.length)    groups.push({ label: "Hoy",           items: today });
  if (thisWeek.length) groups.push({ label: "Esta semana",   items: thisWeek });
  if (older.length)    groups.push({ label: "Anteriores",    items: older });
  return groups;
}

export function HistoryPage({ institution, sessions, onRefresh, onSelect, onExportReport, exportingReport }: HistoryPageProps) {
  const groups = groupByDate(sessions);
  return (
    <section className="page-section">
      <div className="section-heading compact-row">
        <div>
          <h1>Historial</h1>
          <p>{institution?.name ?? "Sesiones anteriores"}</p>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {onExportReport ? (
            <IonButton
              fill="clear"
              onClick={onExportReport}
              disabled={sessions.length === 0 || exportingReport}
              title="Exportar reporte consolidado"
            >
              <IonIcon icon={cloudDownloadOutline} slot="icon-only" />
            </IonButton>
          ) : null}
          <IonButton fill="clear" onClick={onRefresh}>
            <IonIcon icon={refreshOutline} slot="icon-only" />
          </IonButton>
        </div>
      </div>

      {sessions.length === 0 ? (
        <EmptyState title="Sin sesiones" detail="Las sesiones cerradas aparecerán aquí." icon={timeOutline} />
      ) : (
        <>
          {groups.map((group) => (
            <div className="history-date-group" key={group.label}>
              <span className="history-date-label">{group.label}</span>
              <IonList inset>
                {group.items.map((session) => {
                  const badge = sessionBadge(session.status);
                  return (
                    <IonItem button key={session.id} onClick={() => onSelect(session)} lines="full">
                      <IonLabel>
                        <h2 style={{ fontWeight: 600 }}>{session.unit?.name ?? "Unidad académica"}</h2>
                        <p>{formatDate(session.createdAt as string | undefined)}</p>
                      </IonLabel>
                      <span className={`status-badge ${badge.cls}`} slot="end" style={{ marginRight: "6px" }}>
                        {badge.label}
                      </span>
                      <IonIcon icon={chevronForwardOutline} slot="end" color="medium" />
                    </IonItem>
                  );
                })}
              </IonList>
            </div>
          ))}
        </>
      )}
    </section>
  );
}

