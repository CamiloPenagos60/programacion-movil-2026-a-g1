import { IonItem, IonLabel, IonNote } from "@ionic/react";
import type { Person } from "../types/domain";

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

type PersonRowsProps = {
  people: Person[];
};

export function PersonRows({ people }: PersonRowsProps) {
  return (
    <>
      {people.map((person) => (
        <IonItem key={person.id} lines="full">
          <div
            className="person-row-avatar"
            slot="start"
            style={{ background: avatarColor(person.documento) }}
          >
            {initials(person.nombre)}
          </div>
          <IonLabel>
            <h2 style={{ fontWeight: 600 }}>{person.nombre}</h2>
            <p>{person.documento}</p>
          </IonLabel>
          <IonNote slot="end">{person.matricula}</IonNote>
        </IonItem>
      ))}
    </>
  );
}

