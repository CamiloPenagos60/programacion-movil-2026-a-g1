import {
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonSpinner,
} from "@ionic/react";
import { checkmarkCircleOutline, cloudOfflineOutline, linkOutline, serverOutline, wifiOutline } from "ionicons/icons";
import type { BackendStatus } from "../types/domain";

type BackendConfigPageProps = {
  backendUrl: string;
  status: BackendStatus;
  onUrlChange: (value: string) => void;
  onValidate: () => void;
  loading?: boolean;
};

export function BackendConfigPage({ backendUrl, status, onUrlChange, onValidate, loading }: BackendConfigPageProps) {
  return (
    <section className="page-section" style={{ paddingTop: 0 }}>
      <div className="onboarding-hero">
        <div className="onboarding-icon">
          <IonIcon icon={serverOutline} />
        </div>
        <h1>Configuración</h1>
        <p>Conecta la app al backend de asistencia o a un túnel público activo.</p>
      </div>

      <div className="onboarding-steps">
        <div className="onboarding-step">
          <div className="onboarding-step-num">1</div>
          <div>
            <strong>Inicia el backend</strong>
            <p>Ejecuta el servidor de la API o activa el túnel público (ngrok, cloudflared, etc.).</p>
          </div>
        </div>
        <div className="onboarding-step">
          <div className="onboarding-step-num">2</div>
          <div>
            <strong>Ingresa la URL</strong>
            <p>Copia y pega la URL base del backend en el campo de abajo.</p>
          </div>
        </div>
        <div className="onboarding-step">
          <div className="onboarding-step-num">3</div>
          <div>
            <strong>Valida la conexión</strong>
            <p>La app verificará el servidor y cargará las instituciones disponibles.</p>
          </div>
        </div>
      </div>

      <IonList inset>
        <IonItem>
          <IonInput
            label="URL del backend"
            labelPlacement="floating"
            value={backendUrl}
            inputMode="url"
            placeholder="https://tunel-publico.example"
            onIonInput={(event) => onUrlChange(String(event.detail.value ?? ""))}
          >
            <IonIcon icon={linkOutline} slot="start" />
          </IonInput>
        </IonItem>
      </IonList>

      <IonButton expand="block" onClick={onValidate} disabled={loading}>
        {loading ? (
          <><IonSpinner name="crescent" slot="start" />Validando…</>
        ) : (
          <><IonIcon icon={wifiOutline} slot="start" />Validar conexión</>
        )}
      </IonButton>

      <div className={`connection-status ${status.valid ? "status-ok" : "status-warn"}`}>
        <div className="connection-dot" />
        <div>
          <strong>{status.valid ? "Conexión lista" : "Conexión pendiente"}</strong>
          <p>{status.message}</p>
        </div>
        <IonIcon
          icon={status.valid ? checkmarkCircleOutline : cloudOfflineOutline}
          style={{ marginLeft: "auto", fontSize: "22px", flexShrink: 0,
            color: status.valid ? "var(--color-success)" : "var(--color-warning)" }}
        />
      </div>
    </section>
  );
}

