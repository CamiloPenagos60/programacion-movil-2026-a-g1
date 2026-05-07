import { Schema, model, Types, type InferSchemaType } from "mongoose";

const AcademicUnitSchema = new Schema(
  {
    institutionId: { type: Types.ObjectId, required: true, ref: "Institution", index: true },
    code: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: ["ficha", "materia"] },
    active: { type: Boolean, required: true, default: true }
  },
  { collection: "academic_units", timestamps: true }
);

AcademicUnitSchema.index({ institutionId: 1, code: 1 }, { unique: true });
AcademicUnitSchema.index({ institutionId: 1, type: 1, active: 1 });

export type AcademicUnit = InferSchemaType<typeof AcademicUnitSchema>;
export const AcademicUnitModel = model("AcademicUnit", AcademicUnitSchema);

