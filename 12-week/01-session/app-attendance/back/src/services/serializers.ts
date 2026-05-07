import type { Types } from "mongoose";

type MongoLike = {
  _id: Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: unknown;
};

export function toId(value: unknown): string {
  if (value && typeof value === "object" && "toHexString" in value && typeof value.toHexString === "function") {
    return value.toHexString();
  }
  if (value && typeof value === "object" && "_id" in value && (value as { _id: unknown })._id !== value) {
    return toId((value as { _id: unknown })._id);
  }
  if (value && typeof value === "object" && "toString" in value) {
    return String(value);
  }
  return String(value ?? "");
}

export function serializeDocument<T extends MongoLike>(doc: T): Record<string, unknown> {
  const { _id, __v: _version, ...rest } = doc as T & { __v?: unknown };
  return {
    id: toId(_id),
    ...rest
  };
}

export function serializeInstitution(doc: MongoLike): Record<string, unknown> {
  return serializeDocument(doc);
}

export function serializeUnit(doc: MongoLike): Record<string, unknown> {
  return {
    ...serializeDocument(doc),
    institutionId: toId(doc.institutionId)
  };
}

export function serializePerson(doc: MongoLike): Record<string, unknown> {
  const serialized = serializeDocument(doc);
  // Never expose the password field in API responses
  delete serialized["password"];
  return {
    ...serialized,
    institutionId: toId(doc.institutionId)
  };
}

export function serializeSession(doc: MongoLike): Record<string, unknown> {
  return {
    ...serializeDocument(doc),
    institutionId: toId(doc.institutionId),
    unitId: toId(doc.unitId)
  };
}

export function serializeRecord(doc: MongoLike): Record<string, unknown> {
  return {
    ...serializeDocument(doc),
    sessionId: toId(doc.sessionId),
    institutionId: toId(doc.institutionId),
    unitId: toId(doc.unitId),
    personId: doc.personId ? toId(doc.personId) : null
  };
}
