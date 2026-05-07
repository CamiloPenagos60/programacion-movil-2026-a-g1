import { Types } from "mongoose";
import { businessError } from "../utils/app-error";
import { PermissionModel } from "../models/permission.model";

export type PermissionTarget = {
  institutionId?: string;
  unitId?: string;
};

const DEFAULT_ROLE_PERMISSIONS: Record<string, Array<{ resource: string; action: string }>> = {
  ADMIN: [
    { resource: "institution", action: "list" },
    { resource: "unit", action: "list" },
    { resource: "people", action: "list" },
    { resource: "session", action: "create" },
    { resource: "session", action: "activate" },
    { resource: "session", action: "close" },
    { resource: "session", action: "list" },
    { resource: "session", action: "view" },
    { resource: "session", action: "present" },
    { resource: "session", action: "absent" },
    { resource: "session", action: "rejections" },
    { resource: "session", action: "room-code" },
    { resource: "attendance", action: "checkin" }
  ],
  INSTRUCTOR: [
    { resource: "institution", action: "list" },
    { resource: "unit", action: "list" },
    { resource: "people", action: "list" },
    { resource: "session", action: "create" },
    { resource: "session", action: "activate" },
    { resource: "session", action: "close" },
    { resource: "session", action: "list" },
    { resource: "session", action: "view" },
    { resource: "session", action: "present" },
    { resource: "session", action: "absent" },
    { resource: "session", action: "rejections" },
    { resource: "session", action: "room-code" },
    { resource: "attendance", action: "checkin" }
  ],
  DOCENTE: [
    { resource: "institution", action: "list" },
    { resource: "unit", action: "list" },
    { resource: "people", action: "list" },
    { resource: "session", action: "create" },
    { resource: "session", action: "activate" },
    { resource: "session", action: "close" },
    { resource: "session", action: "list" },
    { resource: "session", action: "view" },
    { resource: "session", action: "present" },
    { resource: "session", action: "absent" },
    { resource: "session", action: "rejections" },
    { resource: "session", action: "room-code" },
    { resource: "attendance", action: "checkin" }
  ],
  APRENDIZ: [
    { resource: "institution", action: "list" },
    { resource: "unit", action: "list" },
    { resource: "session", action: "list" },
    { resource: "session", action: "view" },
    { resource: "attendance", action: "checkin" }
  ],
  ESTUDIANTE: [
    { resource: "institution", action: "list" },
    { resource: "unit", action: "list" },
    { resource: "session", action: "list" },
    { resource: "session", action: "view" },
    { resource: "attendance", action: "checkin" }
  ]
};

function matchesScope(entry: { institutionId?: Types.ObjectId | null; unitId?: Types.ObjectId | null }, target?: PermissionTarget) {
  if (!target) return true;
  if (entry.institutionId && target.institutionId && entry.institutionId.toString() !== target.institutionId) {
    return false;
  }
  if (entry.unitId && target.unitId && entry.unitId.toString() !== target.unitId) {
    return false;
  }
  return true;
}

export async function getPermissionsForUser(
  user: { id: string; roles: string[] },
  resource: string,
  action: string
) {
  const query: Record<string, unknown> = {
    resource,
    action,
    active: true,
    $or: [
      { subjectType: "USER", subjectId: user.id },
      { subjectType: "ROLE", subjectId: { $in: user.roles } }
    ]
  };

  return PermissionModel.find(query).lean();
}

export async function ensureDefaultRolePermissions() {
  type RoleName = keyof typeof DEFAULT_ROLE_PERMISSIONS;
  const entries = Object.entries(DEFAULT_ROLE_PERMISSIONS) as Array<[
    RoleName,
    Array<{ resource: string; action: string }>
  ]>;

  const operations = entries.flatMap(([subjectId, permissions]) =>
    permissions.map(({ resource, action }) => ({
      updateOne: {
        filter: { subjectType: "ROLE" as const, subjectId, resource, action },
        update: {
          $set: { active: true, updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date() }
        },
        upsert: true
      }
    }))
  );

  if (operations.length > 0) {
    await PermissionModel.bulkWrite(operations);
  }
}

export async function hasPermission(
  user: { id: string; roles: string[] } | undefined,
  resource: string,
  action: string,
  target?: PermissionTarget
): Promise<boolean> {
  if (!user) return false;

  const entries = await getPermissionsForUser(user, resource, action);
  return entries.some((entry) => matchesScope(entry, target));
}

export async function assertPermission(
  user: { id: string; roles: string[] } | undefined,
  resource: string,
  action: string,
  target?: PermissionTarget
) {
  const allowed = await hasPermission(user, resource, action, target);
  if (!allowed) {
    throw businessError(403, "FORBIDDEN", "No tiene permisos suficientes para esta acción");
  }
}
