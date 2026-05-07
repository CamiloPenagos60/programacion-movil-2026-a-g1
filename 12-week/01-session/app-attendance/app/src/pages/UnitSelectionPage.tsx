import { IonButton, IonIcon, IonItem, IonLabel, IonList } from "@ionic/react";
import { checkmarkCircleOutline, refreshOutline } from "ionicons/icons";
import { EmptyState } from "../components/EmptyState";
import type { AcademicUnit, Institution } from "../types/domain";

type UnitSelectionPageProps = {
  institution: Institution;
  units: AcademicUnit[];
  selectedUnit: AcademicUnit | null;
  onRefresh: () => void;
  onSelect: (unit: AcademicUnit) => void;
};

export function UnitSelectionPage({ institution, units, selectedUnit, onRefresh, onSelect }: UnitSelectionPageProps) {
  return (
    <section className="page-section">
      <div className="section-heading compact-row">
        <div>
          <h1>{institution.labels.unit}</h1>
          <p>{institution.labels.role}: {institution.code}</p>
        </div>
        <IonButton fill="clear" onClick={onRefresh}>
          <IonIcon icon={refreshOutline} slot="icon-only" />
        </IonButton>
      </div>

      {units.length === 0 ? (
        <EmptyState title={`Sin ${institution.labels.unit.toLowerCase()}s`} />
      ) : (
        <IonList inset>
          {units.map((unit) => {
            const isSelected = selectedUnit?.id === unit.id;
            return (
              <IonItem
                button
                key={unit.id}
                onClick={() => onSelect(unit)}
                lines="full"
                style={isSelected ? { "--background": "rgba(25, 113, 194, 0.06)" } : undefined}
              >
                <IonLabel>
                  <h2 style={{ fontWeight: isSelected ? 700 : 600 }}>{unit.name}</h2>
                  <p>Código: {unit.code}</p>
                </IonLabel>
                <div slot="end" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className={`status-badge ${isSelected ? "badge-primary" : "badge-neutral"}`}>{unit.type}</span>
                  {isSelected ? <IonIcon icon={checkmarkCircleOutline} color="primary" /> : null}
                </div>
              </IonItem>
            );
          })}
        </IonList>
      )}
    </section>
  );
}

