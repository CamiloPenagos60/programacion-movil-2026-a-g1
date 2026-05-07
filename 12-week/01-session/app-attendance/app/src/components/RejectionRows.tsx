import { IonItem, IonLabel } from "@ionic/react";
import type { AttendanceRecord } from "../types/domain";

const AVATAR_COLORS = [
  "#1864ab", "#2b8a3e", "#e67700", "#862e9c",
  "#c92a2a", "#0c8599", "#5f3dc4", "#d6336c",
];

function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(nombre: string): string {
  return nombre.split(" ").slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
}

type RejectionRowsProps = {
  records: AttendanceRecord[];
};

export function RejectionRows({ records }: RejectionRowsProps) {
  return (
    <>
      {records.map((record) => {
        const name = record.person?.nombre ?? record.documento;
        return (
          <IonItem key={record.id} lines="full">
            <div
              className="person-row-avatar"
              slot="start"
              style={{ background: avatarColor(record.documento) }}
            >
              {record.person ? initials(name) : name.slice(0, 2).toUpperCase()}
            </div>
            <IonLabel>
              <h2 style={{ fontWeight: 600 }}>{name}</h2>
              <p style={{ fontStyle: "italic" }}>{record.message}</p>
            </IonLabel>
            <span className="rejection-reason-chip" slot="end">
              {record.rejectReason ?? "REJECTED"}
            </span>
          </IonItem>
        );
      })}
    </>
  );
}
