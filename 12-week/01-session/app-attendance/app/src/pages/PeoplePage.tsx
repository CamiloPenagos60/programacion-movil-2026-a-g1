import { IonButton, IonIcon, IonList } from "@ionic/react";
import { refreshOutline } from "ionicons/icons";
import { EmptyState } from "../components/EmptyState";
import { PersonRows } from "../components/PersonRows";
import type { AcademicUnit, Institution, Person } from "../types/domain";

type PeoplePageProps = {
  institution: Institution;
  unit: AcademicUnit | null;
  people: Person[];
  onRefresh: () => void;
};

export function PeoplePage({ institution, unit, people, onRefresh }: PeoplePageProps) {
  return (
    <section className="page-section">
      <div className="section-heading compact-row">
        <div>
          <h1>{institution.labels.people}</h1>
          <p>{unit ? `${institution.labels.unit}: ${unit.code}` : institution.labels.unit}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {people.length > 0 && (
            <span className="count-badge">{people.length}</span>
          )}
          <IonButton fill="clear" onClick={onRefresh} disabled={!unit}>
            <IonIcon icon={refreshOutline} slot="icon-only" />
          </IonButton>
        </div>
      </div>

      {!unit ? (
        <EmptyState title={`${institution.labels.unit} pendiente`} />
      ) : people.length === 0 ? (
        <EmptyState title={`Sin ${institution.labels.people.toLowerCase()}`} detail="Valida el seed o la unidad seleccionada." />
      ) : (
        <IonList inset>
          <PersonRows people={people} />
        </IonList>
      )}
    </section>
  );
}

