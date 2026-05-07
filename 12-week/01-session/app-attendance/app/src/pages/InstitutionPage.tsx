import { IonIcon } from "@ionic/react";
import { chevronForwardOutline } from "ionicons/icons";
import { EmptyState } from "../components/EmptyState";
import type { Institution } from "../types/domain";

type InstitutionPageProps = {
  institutions: Institution[];
  onSelect: (institution: Institution) => void;
};

export function InstitutionPage({ institutions, onSelect }: InstitutionPageProps) {
  return (
    <section className="page-section">
      <div className="section-heading">
        <h1>Selección de Institución</h1>
        <p>Elige tu institución para continuar.</p>
      </div>

      {institutions.length === 0 ? (
        <EmptyState title="Sin instituciones" detail="Carga los seeds y valida el backend." />
      ) : (
        <div className="institution-grid">
          {institutions.map((institution) => (
            <button
              className="institution-tile"
              key={institution.id}
              onClick={() => onSelect(institution)}
            >
              <div className="tile-header">
                <div
                  className="tile-avatar"
                  style={{ background: institution.theme.primary }}
                >
                  {institution.code.slice(0, 2).toUpperCase()}
                </div>
                <div className="tile-title-block">
                  <span className="tile-code">{institution.code}</span>
                  <span className="tile-name">{institution.name}</span>
                </div>
              </div>
              <div className="tile-footer">
                <small>{institution.labels.unit} · {institution.labels.people}</small>
                <IonIcon icon={chevronForwardOutline} className="tile-footer-arrow" />
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

