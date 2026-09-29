import mongoose, { Schema, type Types } from "mongoose";

export interface BlockDoc extends mongoose.Document {
  blocker: Types.ObjectId;
  blocked: Types.ObjectId;
}

/** One-way block edge. Enforcement is bidirectional (see lib/network.ts). */
const BlockSchema = new Schema<BlockDoc>(
  {
    blocker: { type: Schema.Types.ObjectId, ref: "Profile", required: true },
    blocked: { type: Schema.Types.ObjectId, ref: "Profile", required: true },
  },
  { timestamps: true },
);

BlockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });
BlockSchema.index({ blocked: 1 });

export const BlockModel =
  (mongoose.models.Block as mongoose.Model<BlockDoc> | undefined) ??
  mongoose.model<BlockDoc>("Block", BlockSchema);
