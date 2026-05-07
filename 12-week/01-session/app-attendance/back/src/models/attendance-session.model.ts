import { Schema, model, Types, type InferSchemaType } from "mongoose";

const AttendanceSessionSchema = new Schema(
  {
    institutionId: { type: Types.ObjectId, required: true, ref: "Institution", index: true },
    unitId: { type: Types.ObjectId, required: true, ref: "AcademicUnit", index: true },
    status: {
      type: String,
      required: true,
      enum: ["draft", "active", "closed", "expired"],
      default: "draft",
      index: true
    },
    qrToken: { type: String, sparse: true, unique: true },
    qrExpiresAt: { type: Date },
    qrTtlMinutes: { type: Number, required: true, min: 1, max: 120 },
    activatedAt: { type: Date },
    closedAt: { type: Date },
    roomCode: { type: String },
    roomCodeExpiresAt: { type: Date },
    // Short-lived ephemeral QR token (hash stored, plain token returned to client only)
    ephemeralQrTokenHash: { type: String, sparse: true },
    ephemeralQrExpiresAt: { type: Date }
  },
  { collection: "attendance_sessions", timestamps: true }
);

AttendanceSessionSchema.index({ institutionId: 1, unitId: 1, createdAt: -1 });

export type AttendanceSession = InferSchemaType<typeof AttendanceSessionSchema>;
export const AttendanceSessionModel = model("AttendanceSession", AttendanceSessionSchema);

