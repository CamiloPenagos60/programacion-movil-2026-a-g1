import { Schema, model, Types, type InferSchemaType } from "mongoose";

const PermissionSchema = new Schema(
  {
    subjectType: {
      type: String,
      required: true,
      enum: ["ROLE", "USER"]
    },
    subjectId: {
      type: String,
      required: true,
      trim: true
    },
    resource: {
      type: String,
      required: true,
      trim: true
    },
    action: {
      type: String,
      required: true,
      trim: true
    },
    institutionId: {
      type: Types.ObjectId,
      ref: "Institution",
      index: true
    },
    unitId: {
      type: Types.ObjectId,
      ref: "AcademicUnit",
      index: true
    },
    active: {
      type: Boolean,
      required: true,
      default: true
    }
  },
  {
    collection: "permissions",
    timestamps: true
  }
);

PermissionSchema.index({ subjectType: 1, subjectId: 1, resource: 1, action: 1, institutionId: 1, unitId: 1 }, { unique: true });

export type Permission = InferSchemaType<typeof PermissionSchema>;
export const PermissionModel = model("Permission", PermissionSchema);
