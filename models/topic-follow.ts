import mongoose, { Schema, type Types } from "mongoose";

export interface TopicFollowDoc extends mongoose.Document {
  profile: Types.ObjectId;
  tag: string;
}

/** Tag follows power /topics/[tag] follower counts + toggle. */
const TopicFollowSchema = new Schema<TopicFollowDoc>(
  {
    profile: { type: Schema.Types.ObjectId, ref: "Profile", required: true },
    tag: { type: String, required: true, trim: true, lowercase: true },
  },
  { timestamps: true },
);

TopicFollowSchema.index({ profile: 1, tag: 1 }, { unique: true });
TopicFollowSchema.index({ tag: 1 });

export const TopicFollowModel =
  (mongoose.models.TopicFollow as mongoose.Model<TopicFollowDoc> | undefined) ??
  mongoose.model<TopicFollowDoc>("TopicFollow", TopicFollowSchema);
