import mongoose, { Schema, type Types } from "mongoose";

export type ReportTargetKind = "user" | "publication" | "post";
export type ReportReason =
  | "spam"
  | "harassment"
  | "plagiarism"
  | "inappropriate"
  | "other";
export type ReportStatus = "pending" | "actioned" | "dismissed";

export interface ReportDoc extends mongoose.Document {
  reporter: Types.ObjectId;
  targetKind: ReportTargetKind;
  targetId: Types.ObjectId;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
}

const ReportSchema = new Schema<ReportDoc>(
  {
    reporter: { type: Schema.Types.ObjectId, ref: "Profile", required: true },
    targetKind: {
      type: String,
      enum: ["user", "publication", "post"],
      required: true,
    },
    targetId: { type: Schema.Types.ObjectId, required: true },
    reason: {
      type: String,
      enum: ["spam", "harassment", "plagiarism", "inappropriate", "other"],
      required: true,
    },
    details: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["pending", "actioned", "dismissed"],
      default: "pending",
    },
  },
  { timestamps: true },
);

ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ targetKind: 1, targetId: 1 });

export const ReportModel: mongoose.Model<ReportDoc> =
  (mongoose.models.Report as mongoose.Model<ReportDoc> | undefined) ??
  mongoose.model<ReportDoc>("Report", ReportSchema);
