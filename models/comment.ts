import mongoose, { Schema, type Types } from "mongoose";

export interface CommentDoc extends mongoose.Document {
  post: Types.ObjectId;
  author: Types.ObjectId;
  body: string;
}

const CommentSchema = new Schema<CommentDoc>(
  {
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    author: { type: Schema.Types.ObjectId, ref: "Profile", required: true },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
);

CommentSchema.index({ post: 1, createdAt: 1 });

export const CommentModel: mongoose.Model<CommentDoc> =
  (mongoose.models.Comment as mongoose.Model<CommentDoc> | undefined) ??
  mongoose.model<CommentDoc>("Comment", CommentSchema);
