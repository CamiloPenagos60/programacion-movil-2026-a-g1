import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  IonApp,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonLoading,
  IonPage,
  IonTitle,
  IonToast,
  IonToolbar
} from "@ionic/react";
import {
  arrowBackOutline,
  homeOutline,
  keyOutline,
  listOutline,
  logOutOutline,
  peopleOutline,
  qrCodeOutline,
  settingsOutline,
  statsChartOutline,
  timeOutline
} from "ionicons/icons";
import { ApiClient, sanitizeBaseUrl } from "./services/api";
import { getSavedBackendUrl, saveBackendUrl, savePendingQrToken, getPendingQrToken, clearPendingQrToken, savePendingSessionId, getPendingSessionId, clearPendingSessionId } from "./services/preferences";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useRunTask } from "./hooks/useRunTask";
import { useSessionManager } from "./hooks/useSessionManager";
import { useCheckin } from "./hooks/useCheckin";
import { useHistoryReport } from "./hooks/useHistoryReport";
import type {
  AcademicUnit,
  AttendanceSession,
  BackendStatus,
  Institution,
  Person,
  ViewKey
} from "./types/domain";
import { BackendConfigPage } from "./pages/BackendConfigPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HistoryPage } from "./pages/HistoryPage";
import { InstitutionPage } from "./pages/InstitutionPage";
import { LoginPage } from "./pages/LoginPage";
import { PeoplePage } from "./pages/PeoplePage";
import { ResultsPage } from "./pages/ResultsPage";
import { SessionPage } from "./pages/SessionPage";
import { UnitSelectionPage } from "./pages/UnitSelectionPage";
import { CheckinPage } from "./pages/CheckinPage";

const emptyStatus: BackendStatus = {
  valid: false,
  health: false,
  ready: false,
  message: "Configura y valida la URL activa del backend."
};

// Inner component — must be inside AuthProvider
function AppContent() {
  const { isAuthenticated, isLoading: authLoading, user, logout } = useAuth();
  const [view, setView] = useState<ViewKey>("login");
  const [backendUrl, setBackendUrl] = useState("");
  const [backendStatus, setBackendStatus] = useState<BackendStatus>(emptyStatus);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [units, setUnits] = useState<AcademicUnit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<AcademicUnit | null>(null);
  const [people, setPeople] = useState<Person[]>([]);

  const { loading, toast, setToast, setLoading, runTask } = useRunTask();
  const api = useMemo(() => (backendUrl ? new ApiClient(backendUrl) : null), [backendUrl]);

  const [pendingQrToken, setPendingQrToken] = useState<string | null>(null);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);

  const sessionManager = useSessionManager({ api, institution, selectedUnit, runTask, setToast });
  const checkin = useCheckin({ api, institution, setView, runTask, setLoading, pendingQrToken });
  const historyReport = useHistoryReport({ api, institution, selectedUnit, people, runTask, setToast });

  const qrUrl = sessionManager.session && api ? api.attendanceUrl(sessionManager.session) : null;

  const themeStyle = institution
    ? ({
        "--ion-color-primary": institution.theme.primary,
        "--ion-color-secondary": institution.theme.secondary,
        "--app-accent": institution.theme.accent
      } as CSSProperties)
    : undefined;

  const isStudentUser = (roles: string[]) =>
    roles.length > 0 && roles.every((r) => r === "APRENDIZ" || r === "ESTUDIANTE");

  // Auto-select institution for students: their JWT already carries institutionId.
  // Triggers both after login (institutions loaded by handleLoginSuccess) and on
  // app restart (institutions loaded by the startup effect).
  // Skip when there's a pending QR session — the student already has a direct session to check into.
  useEffect(() => {
    if (!user || !institutions.length || institution) return;
    if (!isStudentUser(user.roles)) return;
    if (pendingSessionId) return; // QR flow — do not override the pre-loaded session
    const match = institutions.find((i) => i.id === user.institutionId);
    if (match) void selectInstitution(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, institutions, pendingSessionId]);

  // Startup: wait for auth to resolve, then determine initial view.
  // startupRef prevents repeated navigation while the user is in the app.
  const startupRef = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    if (startupRef.current) return;
    startupRef.current = true;

    // Check if the app was opened from a QR scan deep link
    const scanMatch = window.location.pathname.match(/\/attendance\/scan\/([^/?#]+)/);
    if (scanMatch) {
      const token = decodeURIComponent(scanMatch[1]);
      void (async () => {
        await savePendingQrToken(token);
        setPendingQrToken(token);

        // Auto-configure backend URL from ?api= param embedded in the QR
        const apiParam = new URLSearchParams(window.location.search).get("api");
        let saved = await getSavedBackendUrl();
        if (!saved && apiParam) {
          const sanitized = sanitizeBaseUrl(apiParam);
          await saveBackendUrl(sanitized);
          saved = sanitized;
        }

        if (!saved) {
          setView("config");
          return;
        }
        setBackendUrl(saved);

        // Pre-fetch sessionId immediately while QR token is still within its 20 s TTL.
        // This lets the student take as long as they need to log in without the token expiring.
        try {
          const scanClient = new ApiClient(saved);
          const scanResult = await scanClient.scanQrToken(token);
          if (scanResult.valid && scanResult.session?.id) {
            const sid = scanResult.session.id;
            await savePendingSessionId(sid);
            setPendingSessionId(sid);
            // Pre-load the checkin session so submitCheckin uses sessionId, not the expiring qrToken
            checkin.setCheckinSession({ id: sid, status: "active" } as unknown as import("./types/domain").AttendanceSession);
          }
        } catch {
          // Non-critical — checkin will surface an error if the session is gone
        }

        setView(isAuthenticated ? "checkin" : "login");
      })();
      return;
    }

    if (!isAuthenticated) {
      void (async () => {
        const saved = await getSavedBackendUrl();
        // Restore pending QR data saved during a previous scan
        const savedToken = await getPendingQrToken();
        const savedSid = await getPendingSessionId();
        if (savedToken) setPendingQrToken(savedToken);
        if (savedSid) {
          setPendingSessionId(savedSid);
          checkin.setCheckinSession({ id: savedSid, status: "active" } as unknown as import("./types/domain").AttendanceSession);
        }
        if (!saved) {
          setView("config");
          return;
        }
        setBackendUrl(saved);
        setView("login");
      })();
      return;
    }

    // Authenticated: restore URL and load institutions
    void (async () => {
      const saved = await getSavedBackendUrl();
      if (!saved) {
        setView("config");
        return;
      }
      setBackendUrl(saved);

      // Restore pending QR data (student may have scanned QR then re-opened the app already authenticated)
      const savedToken = await getPendingQrToken();
      const savedSid = await getPendingSessionId();
      if (savedToken) setPendingQrToken(savedToken);
      if (savedSid) {
        setPendingSessionId(savedSid);
        checkin.setCheckinSession({ id: savedSid, status: "active" } as unknown as import("./types/domain").AttendanceSession);
      }

      const candidate = new ApiClient(saved);
      try {
        const data = await candidate.institutions();
        setInstitutions(data);
        // Skip institution page when there's a pending session (student QR flow)
        setView(savedSid ? "checkin" : "institution");
      } catch {
        setView("config");
      }
    })();
  }, [authLoading, isAuthenticated]);

  // React to logout: reset state and go to login
  useEffect(() => {
    if (authLoading || isAuthenticated) return;
    if (!startupRef.current) return; // Startup not done yet — handled by startup effect
    setInstitution(null);
    setSelectedUnit(null);
    setPeople([]);
    setPendingQrToken(null);
    setPendingSessionId(null);
    sessionManager.resetSession();
    historyReport.resetHistory();
    checkin.resetCheckin();
    setView("login");
  }, [isAuthenticated, authLoading]);

  async function handleLoginSuccess() {
    if (!backendUrl) {
      setView("config");
      return;
    }

    const savedToken = await getPendingQrToken();
    const savedSid = await getPendingSessionId();

    if (savedToken) {
      // QR flow: student scanned a QR before logging in.
      // Skip institution page — go directly to the room-code entry screen.
      setPendingQrToken(savedToken);
      if (savedSid) {
        setPendingSessionId(savedSid);
        checkin.setCheckinSession({ id: savedSid, status: "active" } as unknown as import("./types/domain").AttendanceSession);
      }
      // Load institutions silently and set the student's institution for display
      try {
        const institutions = await new ApiClient(backendUrl).institutions();
        setInstitutions(institutions);
        if (user) {
          const match = institutions.find((i) => i.id === user.institutionId);
          if (match) setInstitution(match);
        }
      } catch {
        // Non-critical — checkin will work without institution context
      }
      setView("checkin");
      return;
    }

    // Normal login flow
    await runTask("Cargando instituciones", async () => {
      const candidate = new ApiClient(backendUrl);
      const data = await candidate.institutions();
      setInstitutions(data);
    });

    setView("institution");
  }

  async function handleLogout() {
    await logout();
    // State reset and navigation handled by the isAuthenticated effect above
  }

  async function validateBackend(url = backendUrl, navigate = true) {
    const sanitized = sanitizeBaseUrl(url);
    if (!/^https?:\/\/.+/i.test(sanitized)) {
      setBackendStatus({
        valid: false,
        health: false,
        ready: false,
        message: "La URL debe iniciar con http:// o https://."
      });
      return;
    }

    await runTask("Validando backend", async () => {
      const candidate = new ApiClient(sanitized);
      const status = await candidate.validate();
      setBackendStatus(status);
      setBackendUrl(sanitized);

      if (!status.valid) return;

      await saveBackendUrl(sanitized);
      const data = await candidate.institutions();
      setInstitutions(data);
      if (navigate) setView("institution");
    });
  }

  async function refreshInstitutions() {
    if (!api) return;
    const data = await runTask("Cargando instituciones", () => api.institutions());
    if (data) setInstitutions(data);
  }

  async function selectInstitution(nextInstitution: Institution) {
    setInstitution(nextInstitution);
    setSelectedUnit(null);
    setPeople([]);
    sessionManager.resetSession();
    if (user && isStudentUser(user.roles)) {
      // Students go directly to self-checkin
      // Don't reset if there's a pending session from QR scan
      if (!pendingSessionId) {
        checkin.resetCheckin();
      }
      // Await session load so sessionId is ready before the student can submit checkin.
      // (qrToken expires in 20 s; sessionId is needed for the actual POST)
      // Skip fetching if we already have a session from QR scan
      if (api && !pendingSessionId) {
        const s = await api.activeSessionForInstitution(nextInstitution.id).catch(() => null);
        checkin.setCheckinSession(s ?? null);
      }
      setView("checkin");
    } else {
      setView("dashboard");
      await loadUnits(nextInstitution);
    }
  }

  async function loadUnits(target = institution) {
    if (!api || !target) return;
    const data = await runTask("Cargando unidades", () => api.units(target.id));
    if (data) setUnits(data);
  }

  async function selectUnit(unit: AcademicUnit) {
    setSelectedUnit(unit);
    sessionManager.resetSession();
    await loadPeople(unit);
    setView("dashboard");
  }

  async function loadPeople(unit = selectedUnit) {
    if (!api || !unit) return;
    const data = await runTask("Cargando listado", () => api.people(unit.id));
    if (data) setPeople(data);
  }

  async function selectHistorySession(nextSession: AttendanceSession) {
    sessionManager.setSession(nextSession);
    if (nextSession.unit) {
      setSelectedUnit(nextSession.unit);
      await loadPeople(nextSession.unit);
    }
    await sessionManager.refreshResults(nextSession);
    setView("results");
  }

  function navigate(nextView: ViewKey) {
    if (user && isStudentUser(user.roles) && nextView !== "checkin") {
      setView("checkin");
      return;
    }
    if (nextView === "institution") {
      void refreshInstitutions();
    }
    if (nextView === "history") {
      void historyReport.loadHistory();
    }
    if (nextView === "results") {
      void sessionManager.refreshResults();
    }
    setView(nextView);
  }

  function goBack() {
    if (view === "login") return;
    if (view === "config") return;
    if (view === "institution") {
      setView("config");
      return;
    }
    if (user && isStudentUser(user.roles)) {
      setView("checkin");
      return;
    }
    setView("dashboard");
  }

  function title() {
    if (view === "login") return "Acceso";
    if (view === "config") return "Configuración";
    if (view === "institution") return "Institución";
    if (view === "units") return institution?.labels.unit ?? "Unidades";
    if (view === "people") return institution?.labels.people ?? "Listado";
    if (view === "session") return "Sesión QR";
    if (view === "results") return "Resultados";
    if (view === "history") return "Historial";
    if (view === "checkin") return "Asistencia";
    return institution?.labels.role ?? "Dashboard";
  }

  function subtitle(): string | null {
    if (!institution) return null;
    if (view === "dashboard" || view === "session" || view === "results" || view === "history") {
      return selectedUnit ? `${institution.code} · ${selectedUnit.code}` : institution.code;
    }
    if (view === "units" || view === "people" || view === "checkin") {
      return institution.code;
    }
    return null;
  }

  function renderView() {
    if (view === "login") {
      return (
        <LoginPage
          backendUrl={backendUrl}
          onSuccess={() => void handleLoginSuccess()}
        />
      );
    }

    if (view === "config") {
      return (
        <BackendConfigPage
          backendUrl={backendUrl}
          status={backendStatus}
          onUrlChange={setBackendUrl}
          onValidate={() => void validateBackend()}
          loading={Boolean(loading)}
        />
      );
    }

    if (view === "institution") {
      return <InstitutionPage institutions={institutions} onSelect={(item) => void selectInstitution(item)} />;
    }

    if (!institution) {
      return <InstitutionPage institutions={institutions} onSelect={(item) => void selectInstitution(item)} />;
    }

    if (view === "units") {
      return (
        <UnitSelectionPage
          institution={institution}
          units={units}
          selectedUnit={selectedUnit}
          onRefresh={() => void loadUnits()}
          onSelect={(unit) => void selectUnit(unit)}
        />
      );
    }

    if (view === "people") {
      return (
        <PeoplePage
          institution={institution}
          unit={selectedUnit}
          people={people}
          onRefresh={() => void loadPeople()}
        />
      );
    }

    if (view === "session") {
      return (
        <SessionPage
          institution={institution}
          unit={selectedUnit}
          session={sessionManager.session}
          qrUrl={qrUrl}
          roomCode={sessionManager.roomCode}
          ephemeralQrInfo={sessionManager.ephemeralQrInfo}
          onCreate={() => void sessionManager.createSession()}
          onActivate={() => void sessionManager.activateSession()}
          onClose={() => void sessionManager.closeSession()}
          onRefresh={() => void sessionManager.refreshCurrentSession()}
          onRefreshRoomCode={() => void sessionManager.loadRoomCode()}
          onRefreshQrToken={() => void sessionManager.loadEphemeralQrToken()}
        />
      );
    }

    if (view === "results") {
      return (
        <ResultsPage
          institution={institution}
          session={sessionManager.session}
          present={sessionManager.present}
          absent={sessionManager.absent}
          rejections={sessionManager.rejections}
          onRefresh={() => void sessionManager.refreshResults()}
        />
      );
    }

    if (view === "history") {
      return (
        <HistoryPage
          institution={institution}
          sessions={historyReport.history}
          onRefresh={() => void historyReport.loadHistory()}
          onSelect={(item) => void selectHistorySession(item)}
          onExportReport={() => void historyReport.exportConsolidatedReport()}
          exportingReport={historyReport.exportingReport}
        />
      );
    }

    if (view === "checkin") {
      return (
        <CheckinPage
          institution={institution}
          session={checkin.checkinSession}
          onCheckin={(code) => checkin.submitCheckin(code)}
          onRefresh={() => void checkin.openCheckin()}
          loading={Boolean(loading)}
          result={checkin.checkinResult}
          pendingQrToken={pendingQrToken}
        />
      );
    }

    return (
      <DashboardPage
        institution={institution}
        unit={selectedUnit}
        people={people}
        session={sessionManager.session}
        onNavigate={(target) => navigate(target)}
      />
    );
  }

  return (
    <IonApp style={themeStyle}>
      <IonPage>
        <IonHeader translucent>
          <IonToolbar>
            <IonButtons slot="start">
              {view !== "config" && view !== "login" ? (
                <IonButton onClick={goBack}>
                  <IonIcon icon={arrowBackOutline} slot="icon-only" />
                </IonButton>
              ) : null}
            </IonButtons>
            <IonTitle>
              {subtitle() ? (
                <div className="header-title-stack">
                  <span>{title()}</span>
                  <span className="header-subtitle">{subtitle()}</span>
                </div>
              ) : title()}
            </IonTitle>
            <IonButtons slot="end">
              {isAuthenticated && view !== "login" ? (
                <IonButton onClick={() => void handleLogout()} title={user?.nombre ?? "Cerrar sesión"}>
                  <IonIcon icon={logOutOutline} slot="icon-only" />
                </IonButton>
              ) : null}
              {view !== "login" ? (
                <IonButton onClick={() => setView("config")}>
                  <IonIcon icon={settingsOutline} slot="icon-only" />
                </IonButton>
              ) : null}
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent fullscreen className="app-content">
          <div key={view} className="view-wrapper">
            {renderView()}
          </div>
        </IonContent>

        {institution && view !== "config" && view !== "institution" ? (
          <IonFooter translucent>
            <IonToolbar>
              <nav className="footer-nav">
                <button
                  className={`footer-nav-item${view === "dashboard" ? " nav-active" : ""}`}
                  onClick={() => setView("dashboard")}
                >
                  <span className="nav-pill"><IonIcon icon={homeOutline} /></span>
                  <span>Inicio</span>
                </button>
                {user && !user.roles.some((r) => r === "APRENDIZ" || r === "ESTUDIANTE") ? (
                  <>
                    <button
                      className={`footer-nav-item${view === "units" ? " nav-active" : ""}`}
                      onClick={() => setView("units")}
                    >
                      <span className="nav-pill"><IonIcon icon={listOutline} /></span>
                      <span>{institution.labels.unit}</span>
                    </button>
                    <button
                      className={`footer-nav-item${view === "people" ? " nav-active" : ""}`}
                      onClick={() => setView("people")}
                      disabled={!selectedUnit}
                    >
                      <span className="nav-pill"><IonIcon icon={peopleOutline} /></span>
                      <span>Alumnos</span>
                    </button>
                    <button
                      className={`footer-nav-item${view === "session" ? " nav-active" : ""}`}
                      onClick={() => setView("session")}
                      disabled={!selectedUnit}
                    >
                      <span className="nav-pill"><IonIcon icon={qrCodeOutline} /></span>
                      <span>QR</span>
                    </button>
                    <button
                      className={`footer-nav-item${view === "results" ? " nav-active" : ""}`}
                      onClick={() => void sessionManager.refreshResults().then(() => setView("results"))}
                      disabled={!sessionManager.session}
                    >
                      <span className="nav-pill"><IonIcon icon={statsChartOutline} /></span>
                      <span>Resultados</span>
                    </button>
                    <button
                      className={`footer-nav-item${view === "history" ? " nav-active" : ""}`}
                      onClick={() => void historyReport.loadHistory().then(() => setView("history"))}
                    >
                      <span className="nav-pill"><IonIcon icon={timeOutline} /></span>
                      <span>Historial</span>
                    </button>
                  </>
                ) : (
                  <button
                    className={`footer-nav-item${view === "checkin" ? " nav-active" : ""}`}
                    onClick={() => void checkin.openCheckin()}
                  >
                    <span className="nav-pill"><IonIcon icon={keyOutline} /></span>
                    <span>Asistencia</span>
                  </button>
                )}
              </nav>
            </IonToolbar>
          </IonFooter>
        ) : null}

        <IonLoading isOpen={authLoading || Boolean(loading)} message={authLoading ? "Cargando..." : loading} />
        <IonToast isOpen={Boolean(toast)} message={toast} duration={2500} onDidDismiss={() => setToast("")} />
      </IonPage>
    </IonApp>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
