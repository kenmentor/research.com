import mongoose, { Schema, type Types } from "mongoose";

export interface LikeDoc extends mongoose.Document {
  post: Types.ObjectId;
  profile: Types.ObjectId;
}

/** One like per profile per post (unique edge). */
const LikeSchema = new Schema<LikeDoc>(
  {
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    profile: { type: Schema.Types.ObjectId, ref: "Profile", required: true },
  },
  { timestamps: true },
);

LikeSchema.index({ post: 1, profile: 1 }, { unique: true });
LikeSchema.index({ profile: 1 });

export const LikeModel =
  (mongoose.models.Like as mongoose.Model<LikeDoc> | undefined) ??
  mongoose.model<LikeDoc>("Like", LikeSchema);
