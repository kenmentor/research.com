import mongoose, { Schema, type Types } from "mongoose";

/**
 * 1-1 conversation between exactly two profiles.
 *
 * `status: "requested"` IS the message-requests inbox from the messaging
 * spec: strangers land here, the main inbox only lists `active` threads,
 * and Accept flips the row to `active` (history preserved, no new thread).
 */
export type ConversationStatus = "requested" | "active";

export interface ConversationDoc extends mongoose.Document {
  pairKey: string;
  participants: Types.ObjectId[];
  status: ConversationStatus;
  /** Who initiated a `requested` thread (undefined for active ones). */
  requestedBy?: Types.ObjectId;
  lastMessageAt?: Date;
}

export function conversationPairKey(a: string, b: string): string {
  return [a, b].sort().join(":");
}

const ConversationSchema = new Schema<ConversationDoc>(
  {
    pairKey: { type: String, required: true },
    participants: {
      type: [{ type: Schema.Types.ObjectId, ref: "Profile", required: true }],
      validate: {
        validator: (v: Types.ObjectId[]) => v.length === 2,
        message: "V1 conversations are 1-1: exactly two participants.",
      },
    },
    status: {
      type: String,
      enum: ["requested", "active"],
      default: "active",
    },
    requestedBy: { type: Schema.Types.ObjectId, ref: "Profile" },
    lastMessageAt: { type: Date },
  },
  { timestamps: true },
);

ConversationSchema.index({ pairKey: 1 }, { unique: true });
ConversationSchema.index({ participants: 1, lastMessageAt: -1 });

export const ConversationModel: mongoose.Model<ConversationDoc> =
  (mongoose.models.Conversation as mongoose.Model<ConversationDoc> | undefined) ??
  mongoose.model<ConversationDoc>("Conversation", ConversationSchema);
