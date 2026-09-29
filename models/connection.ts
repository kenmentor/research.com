import mongoose, { Schema, type Types } from "mongoose";

export type ConnectionStatus = "pending" | "accepted" | "declined";

export interface ConnectionDoc extends mongoose.Document {
  requester: Types.ObjectId;
  recipient: Types.ObjectId;
  status: ConnectionStatus;
  /** Stable edge key: the two profile ids sorted + joined. Enforces one row per pair. */
  pairKey: string;
}

export function connectionPairKey(a: string, b: string): string {
  return [a, b].sort().join(":");
}

const ConnectionSchema = new Schema<ConnectionDoc>(
  {
    requester: { type: Schema.Types.ObjectId, ref: "Profile", required: true },
    recipient: { type: Schema.Types.ObjectId, ref: "Profile", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
    pairKey: { type: String, required: true },
  },
  { timestamps: true },
);

ConnectionSchema.index({ pairKey: 1 }, { unique: true });
ConnectionSchema.index({ recipient: 1, status: 1 });
ConnectionSchema.index({ requester: 1, status: 1 });

export const ConnectionModel: mongoose.Model<ConnectionDoc> =
  (mongoose.models.Connection as mongoose.Model<ConnectionDoc> | undefined) ??
  mongoose.model<ConnectionDoc>("Connection", ConnectionSchema);
