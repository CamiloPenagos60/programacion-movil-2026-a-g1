import crypto from "node:crypto";
import { Types } from "mongoose";
import { env } from "../config/env";
import { AcademicUnitModel } from "../models/academic-unit.model";
import { AttendanceRecordModel } from "../models/attendance-record.model";
import { AttendanceSessionModel } from "../models/attendance-session.model";
import { EnrollmentModel } from "../models/enrollment.model";
import { InstitutionModel } from "../models/institution.model";
import { PersonModel } from "../models/person.model";
import { businessError, notFound, validationError } from "../utils/app-error";
import {
  serializeInstitution,
  serializePerson,
  serializeRecord,
  serializeSession,
  serializeUnit,
  toId
} from "./serializers";

type SessionDocument = Awaited<ReturnType<typeof AttendanceSessionModel.findOne>>;

function ensureObjectId(id: string, field = "id"): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw validationError(`${field} invalido`);
  }
  return new Types.ObjectId(id);
}

function normalizeDocumento(documento: string): string {
  return documento.trim();
}

function qrToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

async function refreshSessionStatus(session: NonNullable<SessionDocument>) {
  if (session.status === "active" && session.qrExpiresAt && session.qrExpiresAt.getTime() <= Date.now()) {
    session.status = "expired";
    await session.save();
  }
  return session;
}

async function requireSession(sessionId: string) {
  const id = ensureObjectId(sessionId, "sessionId");
  const session = await AttendanceSessionModel.findById(id);
  if (!session) {
    throw notFound("Sesion no encontrada", "SESSION_NOT_FOUND");
  }
  return refreshSessionStatus(session);
}

function isStudentUser(user?: { roles: string[] }): boolean {
  return Boolean(user?.roles.some((role) => role === "APRENDIZ" || role === "ESTUDIANTE"));
}

async function enrolledUnitIdsForPerson(personId: string, institutionId: string): Promise<Types.ObjectId[]> {
  const personObjectId = ensureObjectId(personId, "personId");
  const institutionObjectId = ensureObjectId(institutionId, "institutionId");
  const enrollments = await EnrollmentModel.find({
    personId: personObjectId,
    institutionId: institutionObjectId,
    active: true
  })
    .select("unitId")
    .lean();

  return enrollments.map((enrollment) => enrollment.unitId as Types.ObjectId);
}

async function requireSessionForUser(
  sessionId: string,
  user?: { id: string; institutionId: string; roles: string[] }
) {
  const session = await requireSession(sessionId);
  if (!user || !isStudentUser(user)) {
    return session;
  }

  if (session.institutionId.toString() !== user.institutionId) {
    throw businessError(403, "INSTITUTION_MISMATCH", "No perteneces a la institución de esta sesión.");
  }

  const enrollment = await EnrollmentModel.findOne({
    unitId: session.unitId,
    personId: ensureObjectId(user.id, "personId"),
    active: true
  }).lean();

  if (!enrollment) {
    throw businessError(403, "NOT_ENROLLED", "No estás inscrito en esta ficha o materia.");
  }

  return session;
}

async function countAccepted(sessionId: Types.ObjectId): Promise<number> {
  return AttendanceRecordModel.countDocuments({ sessionId, status: "accepted" });
}

async function countRejected(sessionId: Types.ObjectId): Promise<number> {
  return AttendanceRecordModel.countDocuments({ sessionId, status: "rejected" });
}

async function enrollmentCount(unitId: Types.ObjectId): Promise<number> {
  return EnrollmentModel.countDocuments({ unitId, active: true });
}

async function buildSessionResponse(session: NonNullable<SessionDocument>, baseUrl?: string) {
  await session.populate(["institutionId", "unitId"]);
  const sessionObject = session.toObject();
  const sessionId = new Types.ObjectId(toId(session._id));
  const unitId = new Types.ObjectId(toId(session.unitId));
  const enrolled = await enrollmentCount(unitId);
  const present = await countAccepted(sessionId);
  const rejected = await countRejected(sessionId);
  const attendanceUrl = session.qrToken && baseUrl ? `${baseUrl}/attendance/${session.qrToken}` : null;

  return {
    ...serializeSession(sessionObject),
    institution:
      typeof sessionObject.institutionId === "object"
        ? serializeInstitution(sessionObject.institutionId as never)
        : undefined,
    unit: typeof sessionObject.unitId === "object" ? serializeUnit(sessionObject.unitId as never) : undefined,
    attendanceUrl,
    counts: {
      enrolled,
      present,
      absent: Math.max(enrolled - present, 0),
      rejected
    }
  };
}

export async function createSession(input: { institutionId: string; unitId: string; qrTtlMinutes?: number }) {
  const institutionId = ensureObjectId(input.institutionId, "institutionId");
  const unitId = ensureObjectId(input.unitId, "unitId");

  const [institution, unit] = await Promise.all([
    InstitutionModel.findOne({ _id: institutionId, active: true }).lean(),
    AcademicUnitModel.findOne({ _id: unitId, institutionId, active: true }).lean()
  ]);

  if (!institution) {
    throw notFound("Institucion no encontrada", "INSTITUTION_NOT_FOUND");
  }
  if (!unit) {
    throw businessError(422, "UNIT_INSTITUTION_MISMATCH", "La ficha o materia no pertenece a la institucion seleccionada.");
  }

  const enrolled = await enrollmentCount(unitId);
  if (enrolled === 0) {
    throw businessError(422, "UNIT_EMPTY", "La ficha o materia no tiene estudiantes o aprendices inscritos.");
  }

  const session = await AttendanceSessionModel.create({
    institutionId,
    unitId,
    status: "draft",
    qrTtlMinutes: input.qrTtlMinutes ?? institution.qr?.ttlMinutes ?? env.QR_DEFAULT_TTL_MINUTES
  });

  return buildSessionResponse(session);
}

export async function activateSession(sessionId: string, baseUrl?: string) {
  const session = await requireSession(sessionId);

  if (session.status === "closed") {
    throw businessError(422, "SESSION_CLOSED", "No se puede activar una sesion cerrada.");
  }

  if (session.status !== "active") {
    const now = new Date();
    session.status = "active";
    session.qrToken = qrToken();
    session.activatedAt = now;
    session.qrExpiresAt = addMinutes(now, session.qrTtlMinutes);
    await session.save();
  }

  return buildSessionResponse(session, baseUrl);
}

export async function closeSession(sessionId: string) {
  const session = await requireSession(sessionId);
  if (session.status !== "closed") {
    session.status = "closed";
    session.closedAt = new Date();
    await session.save();
  }
  return buildSessionResponse(session);
}

export async function getSession(
  sessionId: string,
  baseUrl?: string,
  user?: { id: string; institutionId: string; roles: string[] }
) {
  const session = await requireSessionForUser(sessionId, user);
  return buildSessionResponse(session, baseUrl);
}

export async function listSessions(
  filters: { institutionId?: string; unitId?: string; limit?: number },
  user?: { id: string; institutionId: string; roles: string[] }
) {
  const query: Record<string, unknown> = {};

  if (user && isStudentUser(user)) {
    const institutionId = filters.institutionId ?? user.institutionId;
    if (institutionId !== user.institutionId) {
      throw businessError(403, "INSTITUTION_MISMATCH", "No tienes permiso para ver sesiones de otra institución.");
    }
    const unitIds = await enrolledUnitIdsForPerson(user.id, user.institutionId);
    if (unitIds.length === 0) {
      return [];
    }

    if (filters.unitId) {
      const unitId = ensureObjectId(filters.unitId, "unitId");
      const enrolled = await EnrollmentModel.exists({ unitId, personId: ensureObjectId(user.id, "personId"), active: true });
      if (!enrolled) {
        throw businessError(403, "NOT_ENROLLED", "No tienes permiso para ver esta sesión.");
      }
      query.unitId = unitId;
    } else {
      query.unitId = { $in: unitIds };
    }

    query.institutionId = ensureObjectId(user.institutionId, "institutionId");
    query.status = "active";
  } else {
    if (filters.institutionId) query.institutionId = ensureObjectId(filters.institutionId, "institutionId");
    if (filters.unitId) query.unitId = ensureObjectId(filters.unitId, "unitId");
  }

  const sessions = await AttendanceSessionModel.find(query)
    .sort({ createdAt: -1 })
    .limit(filters.limit ?? 20)
    .populate(["institutionId", "unitId"])
    .lean();

  return Promise.all(
    sessions.map(async (session) => {
      const sessionId = session._id as Types.ObjectId;
      const unitId = new Types.ObjectId(toId(session.unitId));
      return {
        ...serializeSession(session),
        institution:
          typeof session.institutionId === "object" ? serializeInstitution(session.institutionId as never) : undefined,
        unit: typeof session.unitId === "object" ? serializeUnit(session.unitId as never) : undefined,
        counts: {
          enrolled: await enrollmentCount(unitId),
          present: await countAccepted(sessionId),
          rejected: await countRejected(sessionId)
        }
      };
    })
  );
}

export async function listPresent(sessionId: string) {
  const session = await requireSession(sessionId);
  const records = await AttendanceRecordModel.find({ sessionId: session._id, status: "accepted" })
    .sort({ createdAt: -1 })
    .populate("personId")
    .lean();

  return records.map((record) => ({
    ...serializeRecord(record),
    person: typeof record.personId === "object" && record.personId ? serializePerson(record.personId as never) : null
  }));
}

export async function listRejections(sessionId: string) {
  const session = await requireSession(sessionId);
  const records = await AttendanceRecordModel.find({ sessionId: session._id, status: "rejected" })
    .sort({ createdAt: -1 })
    .populate("personId")
    .lean();

  return records.map((record) => ({
    ...serializeRecord(record),
    person: typeof record.personId === "object" && record.personId ? serializePerson(record.personId as never) : null
  }));
}

export async function listAbsent(sessionId: string) {
  const session = await requireSession(sessionId);
  const enrollments = await EnrollmentModel.find({ unitId: session.unitId, active: true }).lean();
  const personIds = enrollments.map((enrollment) => enrollment.personId);
  const accepted = await AttendanceRecordModel.find({
    sessionId: session._id,
    status: "accepted",
    personId: { $in: personIds }
  }).lean();
  const presentIds = new Set(accepted.map((record) => toId(record.personId)));
  const absentIds = personIds.filter((personId) => !presentIds.has(toId(personId)));
  const people = await PersonModel.find({ _id: { $in: absentIds }, active: true }).sort({ nombre: 1 }).lean();
  return people.map(serializePerson);
}

export async function generateEphemeralQrToken(sessionId: string, baseUrl?: string) {
  const session = await requireSession(sessionId);

  if (session.status !== "active") {
    throw businessError(422, "SESSION_NOT_ACTIVE", "La sesion debe estar activa para generar un QR.");
  }

  const plainToken = qrToken();
  const tokenHash = hashToken(plainToken);
  const expiresAt = addSeconds(new Date(), env.QR_TOKEN_TTL_SECONDS);

  session.ephemeralQrTokenHash = tokenHash;
  session.ephemeralQrExpiresAt = expiresAt;
  await session.save();

  const attendanceUrl = baseUrl
    ? `${baseUrl}/attendance/scan/${plainToken}`
    : `/attendance/scan/${plainToken}`; // relative path, should not normally be reached with baseUrl

  return {
    attendanceUrl,
    expiresAt: expiresAt.toISOString(),
    ttlSeconds: env.QR_TOKEN_TTL_SECONDS
  };
}

export async function scanQrToken(plainToken: string) {
  const tokenHash = hashToken(plainToken);
  const session = await AttendanceSessionModel.findOne({
    ephemeralQrTokenHash: tokenHash
  }).populate(["institutionId", "unitId"]);

  if (!session) {
    return {
      valid: false,
      code: "TOKEN_NOT_FOUND",
      message: "QR no válido. Escanea el QR actual.",
      session: null
    };
  }

  const now = new Date();
  if (!session.ephemeralQrExpiresAt || session.ephemeralQrExpiresAt.getTime() <= now.getTime()) {
    return {
      valid: false,
      code: "TOKEN_EXPIRED",
      message: "El QR expiró. Escanea nuevamente el código actual del docente.",
      session: null
    };
  }

  if (session.status !== "active") {
    return {
      valid: false,
      code: session.status === "closed" ? "SESSION_CLOSED" : "SESSION_NOT_ACTIVE",
      message: session.status === "closed" ? "La sesión ya fue cerrada." : "La sesión no está activa.",
      session: null
    };
  }

  const sessionObject = session.toObject();
  return {
    valid: true,
    code: "TOKEN_VALID",
    message: "QR válido. Autentícate para registrar asistencia.",
    qrToken: plainToken,
    expiresAt: session.ephemeralQrExpiresAt.toISOString(),
    requiresAuth: true,
    session: {
      id: String(session._id),
      institutionName: typeof sessionObject.institutionId === "object" && sessionObject.institutionId !== null
        ? (sessionObject.institutionId as { name?: unknown }).name
        : undefined,
      unitName: typeof sessionObject.unitId === "object" && sessionObject.unitId !== null
        ? (sessionObject.unitId as { name?: unknown }).name
        : undefined
    }
  };
}

export async function selfCheckinWithQrToken(input: {
  ephemeralQrToken: string;
  roomCode: string;
  personId: string;
  institutionId: string;
}) {
  const tokenHash = hashToken(input.ephemeralQrToken);
  const sessionDoc = await AttendanceSessionModel.findOne({ ephemeralQrTokenHash: tokenHash });

  if (!sessionDoc) {
    throw businessError(410, "TOKEN_NOT_FOUND", "QR no válido o ya utilizado. Escanea el código actual.");
  }

  const now = new Date();
  if (!sessionDoc.ephemeralQrExpiresAt || sessionDoc.ephemeralQrExpiresAt.getTime() <= now.getTime()) {
    throw businessError(410, "TOKEN_EXPIRED", "El QR expiró. Escanea nuevamente el código actual del docente.");
  }

  return selfCheckin({
    sessionId: String(sessionDoc._id),
    roomCode: input.roomCode,
    personId: input.personId,
    institutionId: input.institutionId
  });
}

export async function getAttendanceFormState(token: string) {
  const session = await AttendanceSessionModel.findOne({ qrToken: token }).populate(["institutionId", "unitId"]);
  if (!session) {
    return {
      canRegister: false,
      code: "SESSION_NOT_FOUND",
      message: "QR no encontrado o no valido.",
      session: null
    };
  }

  await refreshSessionStatus(session);
  const sessionObject = session.toObject();
  const active = session.status === "active";

  return {
    canRegister: active,
    code: active ? "SESSION_ACTIVE" : session.status === "closed" ? "SESSION_CLOSED" : "SESSION_EXPIRED",
    message: active
      ? "Ingresa tu documento para registrar asistencia."
      : session.status === "closed"
        ? "La sesion ya fue cerrada."
        : "El QR ya expiro o la sesion no esta activa.",
    session: {
      ...serializeSession(sessionObject),
      institution:
        typeof sessionObject.institutionId === "object"
          ? serializeInstitution(sessionObject.institutionId as never)
          : undefined,
      unit: typeof sessionObject.unitId === "object" ? serializeUnit(sessionObject.unitId as never) : undefined
    }
  };
}

async function createRejectedRecord(
  session: NonNullable<SessionDocument>,
  documento: string,
  rejectReason:
    | "SESSION_NOT_ACTIVE"
    | "SESSION_CLOSED"
    | "SESSION_EXPIRED"
    | "DOCUMENT_NOT_FOUND"
    | "WRONG_UNIT"
    | "DUPLICATE",
  message: string,
  personId?: Types.ObjectId
) {
  const record = await AttendanceRecordModel.create({
    sessionId: session._id,
    institutionId: session.institutionId,
    unitId: session.unitId,
    personId,
    documento,
    status: "rejected",
    rejectReason,
    message
  });

  return {
    accepted: false,
    code: rejectReason,
    message,
    record: serializeRecord(record.toObject())
  };
}

export async function registerAttendanceByToken(token: string, documentoInput: string) {
  const documento = normalizeDocumento(documentoInput);
  const session = await AttendanceSessionModel.findOne({ qrToken: token });

  if (!session) {
    throw notFound("QR no encontrado o no valido.", "SESSION_NOT_FOUND");
  }

  await refreshSessionStatus(session);

  if (session.status === "closed") {
    return createRejectedRecord(session, documento, "SESSION_CLOSED", "La sesion ya fue cerrada.");
  }

  if (session.status === "expired") {
    return createRejectedRecord(session, documento, "SESSION_EXPIRED", "El QR ya expiro.");
  }

  if (session.status !== "active") {
    return createRejectedRecord(session, documento, "SESSION_NOT_ACTIVE", "La sesion no esta activa.");
  }

  const person = await PersonModel.findOne({
    institutionId: session.institutionId,
    documento,
    active: true
  });

  if (!person) {
    return createRejectedRecord(session, documento, "DOCUMENT_NOT_FOUND", "Documento no encontrado en la institucion.");
  }

  const enrollment = await EnrollmentModel.findOne({
    institutionId: session.institutionId,
    unitId: session.unitId,
    personId: person._id,
    active: true
  });

  if (!enrollment) {
    return createRejectedRecord(
      session,
      documento,
      "WRONG_UNIT",
      "El documento existe, pero no pertenece a esta ficha o materia.",
      person._id as Types.ObjectId
    );
  }

  const existing = await AttendanceRecordModel.findOne({
    sessionId: session._id,
    personId: person._id,
    status: "accepted"
  });

  if (existing) {
    return createRejectedRecord(
      session,
      documento,
      "DUPLICATE",
      "Este documento ya registro asistencia en la sesion.",
      person._id as Types.ObjectId
    );
  }

  try {
    const record = await AttendanceRecordModel.create({
      sessionId: session._id,
      institutionId: session.institutionId,
      unitId: session.unitId,
      personId: person._id,
      documento,
      status: "accepted",
      message: "Asistencia registrada correctamente."
    });

    return {
      accepted: true,
      code: "ATTENDANCE_ACCEPTED",
      message: "Asistencia registrada correctamente.",
      person: serializePerson(person.toObject()),
      record: serializeRecord(record.toObject())
    };
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === 11000) {
      return createRejectedRecord(
        session,
        documento,
        "DUPLICATE",
        "Este documento ya registro asistencia en la sesion.",
        person._id as Types.ObjectId
      );
    }
    throw error;
  }
}

// ─── Room Code (Anti-Fraud) ────────────────────────────────────────────────

/** Characters that are visually unambiguous when read from a projector */
const ROOM_CODE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateRoomCode(): string {
  const bytes = crypto.randomBytes(6);
  return Array.from(bytes)
    .map((b) => ROOM_CODE_CHARSET[b % ROOM_CODE_CHARSET.length])
    .join("");
}

async function getOrRotateRoomCode(
  session: NonNullable<SessionDocument>
): Promise<{ code: string; expiresAt: Date }> {
  const now = new Date();
  if (
    session.roomCode &&
    session.roomCodeExpiresAt &&
    session.roomCodeExpiresAt.getTime() > now.getTime()
  ) {
    return { code: session.roomCode, expiresAt: session.roomCodeExpiresAt };
  }
  const code = generateRoomCode();
  const expiresAt = new Date(now.getTime() + env.ROOM_CODE_TTL_SECONDS * 1000);
  session.roomCode = code;
  session.roomCodeExpiresAt = expiresAt;
  await session.save();
  return { code, expiresAt };
}

export async function getRoomCodeForSession(sessionId: string) {
  const session = await requireSession(sessionId);
  if (session.status !== "active") {
    throw businessError(422, "SESSION_NOT_ACTIVE", "La sesion debe estar activa para obtener el codigo de sala.");
  }
  const { code, expiresAt } = await getOrRotateRoomCode(session);
  const secondsLeft = Math.max(0, Math.round((expiresAt.getTime() - Date.now()) / 1000));
  return {
    code,
    expiresAt: expiresAt.toISOString(),
    secondsLeft,
    ttlSeconds: env.ROOM_CODE_TTL_SECONDS
  };
}

export async function selfCheckin(input: {
  sessionId: string;
  personId: string;
  institutionId: string;
  roomCode: string;
}) {
  const session = await requireSession(input.sessionId);

  if (session.status === "closed") {
    throw businessError(422, "SESSION_CLOSED", "La sesion ya fue cerrada.");
  }
  if (session.status !== "active") {
    throw businessError(422, "SESSION_NOT_ACTIVE", "La sesion no esta activa.");
  }
  if (session.institutionId.toString() !== input.institutionId) {
    throw businessError(403, "INSTITUTION_MISMATCH", "No perteneces a la institucion de esta sesion.");
  }

  // Validate room code — compare trimmed uppercase
  const submittedCode = input.roomCode.trim().toUpperCase();
  const now = new Date();
  if (
    !session.roomCode ||
    !session.roomCodeExpiresAt ||
    session.roomCodeExpiresAt.getTime() <= now.getTime()
  ) {
    throw businessError(422, "CODE_EXPIRED", "El codigo de sala ha expirado. Solicita el codigo actual al docente/instructor.");
  }
  if (session.roomCode !== submittedCode) {
    throw businessError(422, "CODE_INVALID", "Codigo de sala incorrecto. Verifica con el docente/instructor.");
  }

  const personId = ensureObjectId(input.personId, "personId");

  const person = await PersonModel.findById(personId).lean();
  if (!person) {
    throw businessError(404, "PERSON_NOT_FOUND", "Persona no encontrada.");
  }

  const enrollment = await EnrollmentModel.findOne({
    unitId: session.unitId,
    personId,
    active: true
  }).lean();
  if (!enrollment) {
    throw businessError(403, "NOT_ENROLLED", "No estas inscrito en esta ficha o materia.");
  }

  const existing = await AttendanceRecordModel.findOne({
    sessionId: session._id,
    personId,
    status: "accepted"
  }).lean();
  if (existing) {
    throw businessError(409, "ALREADY_REGISTERED", "Tu asistencia ya fue registrada en esta sesion.");
  }

  try {
    const record = await AttendanceRecordModel.create({
      sessionId: session._id,
      institutionId: session.institutionId,
      unitId: session.unitId,
      personId,
      documento: person.documento,
      status: "accepted",
      message: "Asistencia registrada via app (codigo de sala)."
    });

    return {
      accepted: true,
      code: "REGISTERED",
      message: "Asistencia registrada exitosamente.",
      record: serializeRecord(record.toObject()),
      person: serializePerson(person)
    };
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && (error as { code: unknown }).code === 11000) {
      throw businessError(409, "ALREADY_REGISTERED", "Tu asistencia ya fue registrada en esta sesion.");
    }
    throw error;
  }
}
