const now = new Date();
const defaultSourcePaths = {
  real: "/source/seed_asistencia_corhuila_sena_mongo_local.json",
  synthetic: "/source/seed_asistencia_sintetica_mongo_local.json"
};

function resolveSourcePath() {
  const envSourcePath =
    typeof process !== "undefined" && process.env.SEED_SOURCE_PATH
      ? String(process.env.SEED_SOURCE_PATH).trim()
      : "";

  if (envSourcePath) {
    return envSourcePath;
  }

  if (fs.existsSync(defaultSourcePaths.real)) {
    return defaultSourcePaths.real;
  }

  return defaultSourcePaths.synthetic;
}

const sourcePath = resolveSourcePath();

const institutionIds = {
  SENA: ObjectId("660000000000000000000001"),
  CORHUILA: ObjectId("660000000000000000000002")
};

function readSource() {
  try {
    return JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  } catch (error) {
    throw new Error(`No se pudo leer el seed fuente en ${sourcePath}: ${error.message}`);
  }
}

function clean(value) {
  return String(value || "").trim();
}

function normalizeCode(value) {
  return clean(value).toUpperCase();
}

function hex32(value) {
  return (value >>> 0).toString(16).padStart(8, "0");
}

function fnv(seed, text) {
  let hash = seed >>> 0;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function objectIdFromKey(scope, key) {
  const text = `${scope}:${key}`;
  const hex = `${hex32(fnv(0x811c9dc5, text))}${hex32(fnv(0x01000193, text))}${hex32(
    fnv(0x12345678, text)
  )}`;
  return ObjectId(hex.slice(0, 24));
}

function labelsFor(code, unit) {
  if (code === "SENA") {
    return {
      role: "Instructor",
      unit: unit || "Ficha",
      person: "Aprendiz",
      people: "Aprendices"
    };
  }

  return {
    role: "Docente",
    unit: unit || "Materia",
    person: "Estudiante",
    people: "Estudiantes"
  };
}

function themeFor(code) {
  if (code === "SENA") {
    return {
      primary: "#2f9e44",
      secondary: "#0b7285",
      accent: "#f59f00",
      officialColorsConfirmed: false,
      note: "Colores parametrizados pendientes de confirmacion oficial en el proyecto."
    };
  }

  return {
    primary: "#c92a2a",
    secondary: "#1c7ed6",
    accent: "#2f9e44",
    officialColorsConfirmed: false,
    note: "Colores parametrizados pendientes de confirmacion oficial en el proyecto."
  };
}

function upsertMany(collectionName, docs, filterFor) {
  if (!docs.length) return;

  db.getCollection(collectionName).bulkWrite(
    docs.map((doc) => {
      const { _id, createdAt, ...setDoc } = doc;
      return {
        updateOne: {
          filter: filterFor(doc),
          update: {
            $set: { ...setDoc, updatedAt: now },
            $setOnInsert: { _id, createdAt: createdAt || now }
          },
          upsert: true
        }
      };
    })
  );
}

function arrayFromMap(map) {
  return Array.from(map.values());
}

const source = readSource();

if (!Array.isArray(source.instituciones) || !Array.isArray(source.grupos_academicos)) {
  throw new Error("El seed fuente debe contener instituciones y grupos_academicos.");
}

const institutionDocs = source.instituciones.map((institution) => {
  const code = normalizeCode(institution.codigo);
  return {
    _id: institutionIds[code] || objectIdFromKey("institution", code),
    code,
    name: clean(institution.nombre),
    context: code === "SENA" ? "sena" : "university",
    labels: labelsFor(code, clean(institution.unidad)),
    theme: themeFor(code),
    qr: { ttlMinutes: 10 },
    active: true
  };
});

upsertMany("institutions", institutionDocs, (doc) => ({ code: doc.code }));

const institutionByCode = {};
db.institutions
  .find({ code: { $in: institutionDocs.map((institution) => institution.code) } })
  .forEach((institution) => {
    institutionByCode[institution.code] = institution._id;
  });

const unitDocs = [];
const personDocsByKey = new Map();

source.grupos_academicos.forEach((group) => {
  const institutionCode = normalizeCode(group.institucion);
  const institutionId = institutionByCode[institutionCode];
  if (!institutionId) {
    throw new Error(`Grupo con institucion no encontrada: ${group.institucion}`);
  }

  const unitCode = clean(group.codigo);
  unitDocs.push({
    _id: objectIdFromKey("unit", `${institutionCode}:${unitCode}`),
    institutionId,
    code: unitCode,
    name: clean(group.nombre),
    type: clean(group.tipo),
    active: true
  });

  (group.personas || []).forEach((person) => {
    const documento = clean(person.documento);
    const key = `${institutionCode}:${documento}`;
    if (!documento || personDocsByKey.has(key)) return;

    personDocsByKey.set(key, {
      _id: objectIdFromKey("person", key),
      institutionId,
      documento,
      nombre: clean(person.nombre),
      matricula: clean(person.matricula),
      // Dev: default roles by institution context; password = documento (plain text, dev only).
      // Before any production deployment run the hash-passwords migration script.
      roles: institutionCode === "SENA" ? ["APRENDIZ"] : ["ESTUDIANTE"],
      password: documento,
      active: true
    });
  });
});

upsertMany("academic_units", unitDocs, (doc) => ({
  institutionId: doc.institutionId,
  code: doc.code
}));

upsertMany("people", arrayFromMap(personDocsByKey), (doc) => ({
  institutionId: doc.institutionId,
  documento: doc.documento
}));

const unitByInstitutionAndCode = {};
db.academic_units
  .find({ institutionId: { $in: institutionDocs.map((institution) => institution._id) } })
  .forEach((unit) => {
    unitByInstitutionAndCode[`${String(unit.institutionId)}:${unit.code}`] = unit._id;
  });

const personByInstitutionAndDocument = {};
db.people
  .find({ institutionId: { $in: institutionDocs.map((institution) => institution._id) } })
  .forEach((person) => {
    personByInstitutionAndDocument[`${String(person.institutionId)}:${person.documento}`] = person._id;
  });

const enrollmentDocsByKey = new Map();
source.grupos_academicos.forEach((group) => {
  const institutionCode = normalizeCode(group.institucion);
  const institutionId = institutionByCode[institutionCode];
  const unitId = unitByInstitutionAndCode[`${String(institutionId)}:${clean(group.codigo)}`];

  if (!unitId) {
    throw new Error(`No se encontro unidad academica para ${institutionCode}:${group.codigo}`);
  }

  (group.personas || []).forEach((person) => {
    const personId = personByInstitutionAndDocument[`${String(institutionId)}:${clean(person.documento)}`];
    if (!personId) {
      throw new Error(`No se encontro persona para ${institutionCode}:${person.documento}`);
    }

    const key = `${String(unitId)}:${String(personId)}`;
    if (enrollmentDocsByKey.has(key)) return;

    enrollmentDocsByKey.set(key, {
      _id: objectIdFromKey("enrollment", key),
      institutionId,
      unitId,
      personId,
      active: true
    });
  });
});

const enrollmentDocs = arrayFromMap(enrollmentDocsByKey);
upsertMany("enrollments", enrollmentDocs, (doc) => ({
  unitId: doc.unitId,
  personId: doc.personId
}));

const activeInstitutionIds = institutionDocs.map((institution) => institution._id);
const activeUnitIds = unitDocs.map((unit) => unitByInstitutionAndCode[`${String(unit.institutionId)}:${unit.code}`]).filter(Boolean);
const activePersonIds = arrayFromMap(personDocsByKey)
  .map((person) => personByInstitutionAndDocument[`${String(person.institutionId)}:${person.documento}`])
  .filter(Boolean);
const activeEnrollmentKeySet = new Set(enrollmentDocs.map((enrollment) => `${String(enrollment.unitId)}:${String(enrollment.personId)}`));
const activeEnrollmentIds = [];

db.enrollments
  .find({
    institutionId: { $in: activeInstitutionIds },
    unitId: { $in: activeUnitIds },
    personId: { $in: activePersonIds }
  })
  .forEach((enrollment) => {
    const key = `${String(enrollment.unitId)}:${String(enrollment.personId)}`;
    if (activeEnrollmentKeySet.has(key)) {
      activeEnrollmentIds.push(enrollment._id);
    }
  });

db.academic_units.updateMany(
  { institutionId: { $in: activeInstitutionIds }, _id: { $nin: activeUnitIds } },
  { $set: { active: false, updatedAt: now } }
);
db.people.updateMany(
  { institutionId: { $in: activeInstitutionIds }, _id: { $nin: activePersonIds } },
  { $set: { active: false, updatedAt: now } }
);
db.enrollments.updateMany(
  { institutionId: { $in: activeInstitutionIds }, _id: { $nin: activeEnrollmentIds } },
  { $set: { active: false, updatedAt: now } }
);

db.institutions.createIndex({ code: 1 }, { unique: true });
db.academic_units.createIndex({ institutionId: 1, type: 1, active: 1 });
db.academic_units.createIndex({ institutionId: 1, code: 1 }, { unique: true });
db.people.createIndex({ institutionId: 1, documento: 1 }, { unique: true });
db.enrollments.createIndex({ unitId: 1, personId: 1 }, { unique: true });
db.enrollments.createIndex({ institutionId: 1, unitId: 1, active: 1 });
db.attendance_sessions.createIndex({ qrToken: 1 }, { unique: true, sparse: true });
db.attendance_sessions.createIndex({ institutionId: 1, unitId: 1, createdAt: -1 });
db.attendance_records.createIndex(
  { sessionId: 1, personId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "accepted" } }
);
db.attendance_records.createIndex({ sessionId: 1, status: 1, createdAt: -1 });
const permissionDocs = [];
const rolePermissions = {
  ADMIN: [
    ["institution", "list"],
    ["unit", "list"],
    ["people", "list"],
    ["session", "create"],
    ["session", "activate"],
    ["session", "close"],
    ["session", "list"],
    ["session", "view"],
    ["session", "present"],
    ["session", "absent"],
    ["session", "rejections"],
    ["session", "room-code"],
    ["attendance", "checkin"]
  ],
  INSTRUCTOR: [
    ["institution", "list"],
    ["unit", "list"],
    ["people", "list"],
    ["session", "create"],
    ["session", "activate"],
    ["session", "close"],
    ["session", "list"],
    ["session", "view"],
    ["session", "present"],
    ["session", "absent"],
    ["session", "rejections"],
    ["session", "room-code"],
    ["attendance", "checkin"]
  ],
  DOCENTE: [
    ["institution", "list"],
    ["unit", "list"],
    ["people", "list"],
    ["session", "create"],
    ["session", "activate"],
    ["session", "close"],
    ["session", "list"],
    ["session", "view"],
    ["session", "present"],
    ["session", "absent"],
    ["session", "rejections"],
    ["session", "room-code"],
    ["attendance", "checkin"]
  ],
  APRENDIZ: [
    ["institution", "list"],
    ["unit", "list"],
    ["session", "list"],
    ["session", "view"],
    ["attendance", "checkin"]
  ],
  ESTUDIANTE: [
    ["institution", "list"],
    ["unit", "list"],
    ["session", "list"],
    ["session", "view"],
    ["attendance", "checkin"]
  ]
};

Object.entries(rolePermissions).forEach(([role, permissions]) => {
  permissions.forEach(([resource, action]) => {
    permissionDocs.push({
      _id: objectIdFromKey("permission", `${role}:${resource}:${action}`),
      subjectType: "ROLE",
      subjectId: role,
      resource,
      action,
      active: true,
      createdAt: now,
      updatedAt: now
    });
  });
});

upsertMany("permissions", permissionDocs, (doc) => ({
  subjectType: doc.subjectType,
  subjectId: doc.subjectId,
  resource: doc.resource,
  action: doc.action
}));
// ---------------------------------------------------------------------------
// Cuentas de instructor/docente
// Documento 1079606375 trabaja en ambas instituciones con roles de formador.
// $set solo actualiza roles y password (preserva nombre/matricula si ya existe).
// $setOnInsert crea el registro si no existe en el seed fuente.
// ---------------------------------------------------------------------------
const instructorDoc = "1079606375";

db.people.updateOne(
  { institutionId: institutionIds.SENA, documento: instructorDoc },
  {
    $set: {
      roles: ["INSTRUCTOR"],
      password: instructorDoc,
      active: true,
      updatedAt: now
    },
    $setOnInsert: {
      _id: objectIdFromKey("person", `SENA:${instructorDoc}`),
      institutionId: institutionIds.SENA,
      documento: instructorDoc,
      nombre: "Instructor SENA",
      matricula: "INS-001",
      createdAt: now
    }
  },
  { upsert: true }
);

db.people.updateOne(
  { institutionId: institutionIds.CORHUILA, documento: instructorDoc },
  {
    $set: {
      roles: ["DOCENTE"],
      password: instructorDoc,
      active: true,
      updatedAt: now
    },
    $setOnInsert: {
      _id: objectIdFromKey("person", `CORHUILA:${instructorDoc}`),
      institutionId: institutionIds.CORHUILA,
      documento: instructorDoc,
      nombre: "Docente CORHUILA",
      matricula: "DOC-001",
      createdAt: now
    }
  },
  { upsert: true }
);

// ---------------------------------------------------------------------------
// Usuario de desarrollo: Jesús González
// Tiene rol INSTRUCTOR en SENA y DOCENTE en CORHUILA (demuestra soporte multi-rol).
// Contraseña: qwerty.2026  →  almacenada con bcrypt cost=10.
// Usado para demos y pruebas locales. NO usar en producción.
// ---------------------------------------------------------------------------
const jesusDoc = "0000000001";
// Hash bcrypt de "qwerty.2026" generado con bcryptjs cost=10
const jesusPasswordHash = "$2a$10$ispNzqQblhG.aCO/Q0cAK.vM3xZ3EOli2bhr9X7yUViB/GQ3nyPlK";

db.people.updateOne(
  { institutionId: institutionIds.SENA, documento: jesusDoc },
  {
    $set: {
      roles: ["INSTRUCTOR"],
      password: jesusPasswordHash,
      active: true,
      updatedAt: now
    },
    $setOnInsert: {
      _id: objectIdFromKey("person", `SENA:${jesusDoc}`),
      institutionId: institutionIds.SENA,
      documento: jesusDoc,
      nombre: "Jesús González",
      matricula: "INS-JG-001",
      createdAt: now
    }
  },
  { upsert: true }
);

db.people.updateOne(
  { institutionId: institutionIds.CORHUILA, documento: jesusDoc },
  {
    $set: {
      roles: ["DOCENTE"],
      password: jesusPasswordHash,
      active: true,
      updatedAt: now
    },
    $setOnInsert: {
      _id: objectIdFromKey("person", `CORHUILA:${jesusDoc}`),
      institutionId: institutionIds.CORHUILA,
      documento: jesusDoc,
      nombre: "Jesús González",
      matricula: "DOC-JG-001",
      createdAt: now
    }
  },
  { upsert: true }
);

printjson({
  message: "Seed de asistencia aplicado correctamente.",
  sourcePath,
  institutions: institutionDocs.length,
  academicUnits: activeUnitIds.length,
  people: activePersonIds.length,
  enrollments: activeEnrollmentIds.length,
  sourceRows: source.grupos_academicos.reduce((total, group) => total + (group.personas || []).length, 0)
});
