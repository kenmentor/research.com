import mongoose, { Schema, type Types } from "mongoose";

export interface PostDoc extends mongoose.Document {
  author: Types.ObjectId;
  body: string;
  linkUrl: string;
  imageUrl: string;
  publicationId?: Types.ObjectId;
  /** Set when this post is a quote-repost of another post. */
  repostOf?: Types.ObjectId;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
}

const PostSchema = new Schema<PostDoc>(
  {
    author: { type: Schema.Types.ObjectId, ref: "Profile", required: true },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
    linkUrl: { type: String, default: "", trim: true },
    imageUrl: { type: String, default: "", trim: true },
    publicationId: { type: Schema.Types.ObjectId, ref: "Publication" },
    repostOf: { type: Schema.Types.ObjectId, ref: "Post" },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    repostsCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ createdAt: -1 });

export const PostModel =
  mongoose.models.Post ?? mongoose.model<PostDoc>("Post", PostSchema);
