import { Schema, model, type InferSchemaType } from "mongoose";

const InstitutionSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    context: { type: String, required: true, enum: ["sena", "university"] },
    labels: {
      role: { type: String, required: true },
      unit: { type: String, required: true },
      person: { type: String, required: true },
      people: { type: String, required: true }
    },
    theme: {
      primary: { type: String, required: true },
      secondary: { type: String, required: true },
      accent: { type: String, required: true },
      officialColorsConfirmed: { type: Boolean, required: true, default: false },
      note: { type: String, required: true }
    },
    qr: {
      ttlMinutes: { type: Number, required: true, min: 1, max: 120 }
    },
    active: { type: Boolean, required: true, default: true }
  },
  { collection: "institutions", timestamps: true }
);

export type Institution = InferSchemaType<typeof InstitutionSchema>;
export const InstitutionModel = model("Institution", InstitutionSchema);

