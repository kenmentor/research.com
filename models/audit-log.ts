import mongoose, { Schema, type Types } from "mongoose";

/**
 * Append-only moderation audit trail. Rows are only ever inserted —
 * no update/delete API is exposed for this collection.
 */
export interface AuditLogDoc extends mongoose.Document {
  adminId: Types.ObjectId;
  action: string;
  targetKind: string;
  targetId?: Types.ObjectId;
  reason: string;
}

const AuditLogSchema = new Schema<AuditLogDoc>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true, trim: true },
    targetKind: { type: String, required: true, trim: true },
    targetId: { type: Schema.Types.ObjectId },
    reason: { type: String, default: "", trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

AuditLogSchema.index({ createdAt: -1 });

export const AuditLogModel: mongoose.Model<AuditLogDoc> =
  (mongoose.models.AuditLog as mongoose.Model<AuditLogDoc> | undefined) ??
  mongoose.model<AuditLogDoc>("AuditLog", AuditLogSchema);
