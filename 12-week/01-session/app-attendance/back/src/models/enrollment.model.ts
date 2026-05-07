import { Schema, model, Types, type InferSchemaType } from "mongoose";

const EnrollmentSchema = new Schema(
  {
    institutionId: { type: Types.ObjectId, required: true, ref: "Institution", index: true },
    unitId: { type: Types.ObjectId, required: true, ref: "AcademicUnit", index: true },
    personId: { type: Types.ObjectId, required: true, ref: "Person", index: true },
    active: { type: Boolean, required: true, default: true }
  },
  { collection: "enrollments", timestamps: true }
);

EnrollmentSchema.index({ unitId: 1, personId: 1 }, { unique: true });
EnrollmentSchema.index({ institutionId: 1, unitId: 1, active: 1 });

export type Enrollment = InferSchemaType<typeof EnrollmentSchema>;
export const EnrollmentModel = model("Enrollment", EnrollmentSchema);

