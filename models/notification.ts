import mongoose, { Schema, type Types } from "mongoose";

export type NotificationType =
  | "connect_request"
  | "connect_accept"
  | "message"
  | "cite"
  | "mention";

export type NotificationTargetKind =
  | "profile"
  | "publication"
  | "post"
  | "conversation";

export interface NotificationDoc extends mongoose.Document {
  recipient: Types.ObjectId;
  type: NotificationType;
  actor?: Types.ObjectId;
  targetKind?: NotificationTargetKind;
  targetId?: Types.ObjectId;
  read: boolean;
  /** Populated by Mongoose `timestamps: true`. */
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<NotificationDoc>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "Profile", required: true },
    type: {
      type: String,
      enum: ["connect_request", "connect_accept", "message", "cite", "mention"],
      required: true,
    },
    actor: { type: Schema.Types.ObjectId, ref: "Profile" },
    targetKind: {
      type: String,
      enum: ["profile", "publication", "post", "conversation"],
    },
    targetId: { type: Schema.Types.ObjectId },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export const NotificationModel: mongoose.Model<NotificationDoc> =
  (mongoose.models.Notification as mongoose.Model<NotificationDoc> | undefined) ??
  mongoose.model<NotificationDoc>("Notification", NotificationSchema);
