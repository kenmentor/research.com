import mongoose, { Schema, type Types } from "mongoose";

export interface SaveDoc extends mongoose.Document {
  post: Types.ObjectId;
  profile: Types.ObjectId;
}

/** One save per profile per post (unique edge). */
const SaveSchema = new Schema<SaveDoc>(
  {
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    profile: { type: Schema.Types.ObjectId, ref: "Profile", required: true },
  },
  { timestamps: true },
);

SaveSchema.index({ post: 1, profile: 1 }, { unique: true });
SaveSchema.index({ profile: 1 });

export const SaveModel =
  (mongoose.models.Save as mongoose.Model<SaveDoc> | undefined) ??
  mongoose.model<SaveDoc>("Save", SaveSchema);
