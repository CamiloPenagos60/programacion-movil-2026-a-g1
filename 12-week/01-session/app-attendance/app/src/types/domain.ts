export type InstitutionContext = "sena" | "university";
export type UnitType = "ficha" | "materia";
export type SessionStatus = "draft" | "active" | "closed" | "expired";
export type PersonRole = "ADMIN" | "INSTRUCTOR" | "DOCENTE" | "APRENDIZ" | "ESTUDIANTE";

export type Institution = {
  id: string;
  code: string;
  name: string;
  context: InstitutionContext;
  labels: {
    role: string;
    unit: string;
    person: string;
    people: string;
  };
  theme: {
    primary: string;
    secondary: string;
    accent: string;
    officialColorsConfirmed: boolean;
    note: string;
  };
  qr: {
    ttlMinutes: number;
  };
};

export type AcademicUnit = {
  id: string;
  institutionId: string;
  code: string;
  name: string;
  type: UnitType;
};

export type Person = {
  id: string;
  institutionId: string;
  documento: string;
  nombre: string;
  matricula: string;
  roles?: PersonRole[];
};

export type AttendanceSession = {
  id: string;
  institutionId: string;
  unitId: string;
  status: SessionStatus;
  qrToken?: string;
  qrExpiresAt?: string;
  qrTtlMinutes: number;
  attendanceUrl?: string | null;
  institution?: Institution;
  unit?: AcademicUnit;
  createdAt?: string;
  updatedAt?: string;
  counts?: {
    enrolled: number;
    present: number;
    absent: number;
    rejected: number;
  };
};

export type AttendanceRecord = {
  id: string;
  sessionId: string;
  institutionId: string;
  unitId: string;
  personId: string | null;
  documento: string;
  status: "accepted" | "rejected";
  rejectReason?: string;
  message: string;
  createdAt: string;
  person?: Person | null;
};

export type BackendStatus = {
  valid: boolean;
  health: boolean;
  ready: boolean;
  message: string;
  institutions?: number;
};

export type RoomCode = {
  code: string;
  expiresAt: string;
  secondsLeft: number;
  ttlSeconds: number;
};

export type EphemeralQrInfo = {
  attendanceUrl: string;
  expiresAt: string;
  ttlSeconds: number;
};

export type ViewKey =
  | "login"
  | "config"
  | "institution"
  | "dashboard"
  | "units"
  | "people"
  | "session"
  | "results"
  | "history"
  | "checkin";

export type AuthUser = {
  id: string;
  institutionId: string;
  documento: string;
  nombre: string;
  roles: PersonRole[];
};
