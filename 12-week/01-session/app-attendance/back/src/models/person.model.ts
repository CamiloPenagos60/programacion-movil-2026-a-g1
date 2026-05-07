import { Schema, model, Types, type InferSchemaType } from "mongoose";

export const PERSON_ROLES = ["ADMIN", "INSTRUCTOR", "DOCENTE", "APRENDIZ", "ESTUDIANTE"] as const;

const PersonSchema = new Schema(
  {
    institutionId: { type: Types.ObjectId, required: true, ref: "Institution", index: true },
    documento: { type: String, required: true, trim: true },
    nombre: { type: String, required: true, trim: true },
    matricula: { type: String, required: true, trim: true },
    roles: { type: [String], enum: PERSON_ROLES, default: [] },
    password: { type: String, select: false },
    active: { type: Boolean, required: true, default: true }
  },
  { collection: "people", timestamps: true }
);

PersonSchema.index({ institutionId: 1, documento: 1 }, { unique: true });

export type Person = InferSchemaType<typeof PersonSchema>;
export const PersonModel = model("Person", PersonSchema);

