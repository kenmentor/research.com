import mongoose, { Schema, type Types } from "mongoose";

export interface FollowDoc extends mongoose.Document {
  follower: Types.ObjectId;
  following: Types.ObjectId;
}

const FollowSchema = new Schema<FollowDoc>(
  {
    follower: { type: Schema.Types.ObjectId, ref: "Profile", required: true },
    following: { type: Schema.Types.ObjectId, ref: "Profile", required: true },
  },
  { timestamps: true },
);

// One-way edge: a follower follows another profile at most once.
FollowSchema.index({ follower: 1, following: 1 }, { unique: true });
FollowSchema.index({ following: 1 });

export const FollowModel =
  mongoose.models.Follow ?? mongoose.model<FollowDoc>("Follow", FollowSchema);
