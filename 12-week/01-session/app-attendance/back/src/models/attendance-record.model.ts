import { Schema, model, Types, type InferSchemaType } from "mongoose";

const AttendanceRecordSchema = new Schema(
  {
    sessionId: { type: Types.ObjectId, required: true, ref: "AttendanceSession", index: true },
    institutionId: { type: Types.ObjectId, required: true, ref: "Institution", index: true },
    unitId: { type: Types.ObjectId, required: true, ref: "AcademicUnit", index: true },
    personId: { type: Types.ObjectId, ref: "Person", index: true },
    documento: { type: String, required: true, trim: true },
    status: { type: String, required: true, enum: ["accepted", "rejected"], index: true },
    rejectReason: {
      type: String,
      enum: [
        "SESSION_NOT_FOUND",
        "SESSION_NOT_ACTIVE",
        "SESSION_CLOSED",
        "SESSION_EXPIRED",
        "DOCUMENT_NOT_FOUND",
        "WRONG_UNIT",
        "DUPLICATE"
      ]
    },
    message: { type: String, required: true }
  },
  { collection: "attendance_records", timestamps: true }
);

AttendanceRecordSchema.index(
  { sessionId: 1, personId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "accepted" } }
);
AttendanceRecordSchema.index({ sessionId: 1, status: 1, createdAt: -1 });

export type AttendanceRecord = InferSchemaType<typeof AttendanceRecordSchema>;
export const AttendanceRecordModel = model("AttendanceRecord", AttendanceRecordSchema);

