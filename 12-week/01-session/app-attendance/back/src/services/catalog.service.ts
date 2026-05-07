import { Types } from "mongoose";
import { AcademicUnitModel } from "../models/academic-unit.model";
import { EnrollmentModel } from "../models/enrollment.model";
import { InstitutionModel } from "../models/institution.model";
import { PersonModel } from "../models/person.model";
import { notFound, validationError } from "../utils/app-error";
import { serializeInstitution, serializePerson, serializeUnit } from "./serializers";

function ensureObjectId(id: string, field = "id"): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw validationError(`${field} invalido`);
  }
  return new Types.ObjectId(id);
}

export async function listInstitutions(user?: { roles: string[]; institutionId: string }) {
  if (user?.roles.some((role) => role === "APRENDIZ" || role === "ESTUDIANTE")) {
    const institution = await InstitutionModel.findOne({ _id: ensureObjectId(user.institutionId, "institutionId"), active: true }).lean();
    return institution ? [serializeInstitution(institution)] : [];
  }

  const institutions = await InstitutionModel.find({ active: true }).sort({ code: 1 }).lean();
  return institutions.map(serializeInstitution);
}

export async function listUnitsByInstitution(institutionId: string, user?: { roles: string[]; id: string; institutionId: string }) {
  const id = ensureObjectId(institutionId, "institutionId");
  const institution = await InstitutionModel.exists({ _id: id, active: true });
  if (!institution) {
    throw notFound("Institucion no encontrada", "INSTITUTION_NOT_FOUND");
  }

  if (user?.roles.some((role) => role === "APRENDIZ" || role === "ESTUDIANTE")) {
    if (user.institutionId !== institutionId) {
      throw notFound("Institucion no encontrada", "INSTITUTION_NOT_FOUND");
    }
    const enrollments = await EnrollmentModel.find({ personId: ensureObjectId(user.id, "personId"), institutionId: id, active: true })
      .select("unitId")
      .lean();
    const unitIds = enrollments.map((enrollment) => enrollment.unitId as Types.ObjectId);
    if (unitIds.length === 0) {
      return [];
    }
    const units = await AcademicUnitModel.find({ _id: { $in: unitIds }, institutionId: id, active: true }).sort({ code: 1 }).lean();
    return units.map(serializeUnit);
  }

  const units = await AcademicUnitModel.find({ institutionId: id, active: true }).sort({ code: 1 }).lean();
  return units.map(serializeUnit);
}

export async function listPeopleByUnit(unitId: string) {
  const id = ensureObjectId(unitId, "unitId");
  const unit = await AcademicUnitModel.findOne({ _id: id, active: true }).lean();
  if (!unit) {
    throw notFound("Ficha o materia no encontrada", "UNIT_NOT_FOUND");
  }

  const enrollments = await EnrollmentModel.find({ unitId: id, active: true }).sort({ createdAt: 1 }).lean();
  const personIds = enrollments.map((enrollment) => enrollment.personId);
  const people = await PersonModel.find({ _id: { $in: personIds }, active: true }).sort({ nombre: 1 }).lean();
  return {
    unit: serializeUnit(unit),
    data: people.map(serializePerson)
  };
}

