import { useState } from "react";
import {
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonSpinner,
} from "@ionic/react";
import { alertCircleOutline, bookOutline, lockClosedOutline, personCircleOutline } from "ionicons/icons";
import { authService, type LoginCredentials } from "../services/auth-service";
import { useAuth } from "../context/AuthContext";

interface LoginPageProps {
  backendUrl: string;
  onSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ backendUrl, onSuccess }) => {
  const [documento, setDocumento] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login: authLogin } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!backendUrl) {
      setError("Configura la URL del backend antes de iniciar sesión.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const credentials: LoginCredentials = { documento, password };
      const response = await authService.login(credentials, backendUrl);
      await authLogin(response.data.person, response.data.token);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión. Verifica tus credenciales.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-section login-page">
      <div className="login-hero">
        <div className="login-icon">
          <IonIcon icon={bookOutline} />
        </div>
        <h1>Control de Asistencia</h1>
        <p>Ingresa con tu documento y contraseña</p>
      </div>

      <div className="login-card">
        <form onSubmit={(e) => void handleLogin(e)}>
          <IonList lines="none" style={{ background: "transparent", padding: 0 }}>
            <IonItem style={{ "--background": "transparent", marginBottom: "10px" }}>
              <IonInput
                label="Documento"
                labelPlacement="floating"
                value={documento}
                onIonInput={(e) => setDocumento(String(e.detail.value ?? ""))}
                type="text"
                placeholder="Número de documento"
                required
                autocomplete="username"
              >
                <IonIcon icon={personCircleOutline} slot="start" />
              </IonInput>
            </IonItem>
            <IonItem style={{ "--background": "transparent" }}>
              <IonInput
                label="Contraseña"
                labelPlacement="floating"
                value={password}
                onIonInput={(e) => setPassword(String(e.detail.value ?? ""))}
                type="password"
                placeholder="Contraseña"
                required
                autocomplete="current-password"
              >
                <IonIcon icon={lockClosedOutline} slot="start" />
              </IonInput>
            </IonItem>
          </IonList>

          <IonButton expand="block" type="submit" disabled={loading} style={{ marginTop: "16px" }}>
            {loading ? (
              <>
                <IonSpinner name="crescent" slot="start" />
                Iniciando sesión…
              </>
            ) : "Iniciar Sesión"}
          </IonButton>
        </form>

        {error && (
          <div className="login-error">
            <IonIcon icon={alertCircleOutline} style={{ fontSize: "20px", flexShrink: 0, marginTop: "1px" }} />
            {error}
          </div>
        )}
      </div>
    </section>
  );
};

export default LoginPage;
