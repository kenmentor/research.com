import mongoose, { Schema, type Types } from "mongoose";

export type MessageState = "sent" | "delivered" | "read";

export interface MessageDoc extends mongoose.Document {
  conversationId: Types.ObjectId;
  sender: Types.ObjectId;
  body: string;
  state: MessageState;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<MessageDoc>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: { type: Schema.Types.ObjectId, ref: "Profile", required: true },
    body: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 2000,
    },
    state: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
  },
  { timestamps: true },
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });

export const MessageModel: mongoose.Model<MessageDoc> =
  (mongoose.models.Message as mongoose.Model<MessageDoc> | undefined) ??
  mongoose.model<MessageDoc>("Message", MessageSchema);
