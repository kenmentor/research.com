import mongoose, { Schema, type Types } from "mongoose";

export interface PublicationAuthor {
  name: string;
  profileId?: Types.ObjectId;
}

export interface PublicationDoc extends mongoose.Document {
  owner: Types.ObjectId;
  title: string;
  authors: PublicationAuthor[];
  venue: string;
  year?: number;
  doi: string;
  abstract: string;
  tags: string[];
  /** Remote file URL only — raw bytes are NEVER stored in Mongo. */
  fileUrl: string;
  fileMime: string;
  fileSize: number;
  featured: boolean;
  readsCount: number;
  downloadsCount: number;
  citationsCount: number;
}

const AuthorSchema = new Schema<PublicationAuthor>(
  {
    name: { type: String, required: true, trim: true },
    profileId: { type: Schema.Types.ObjectId, ref: "Profile" },
  },
  { _id: false },
);

const PublicationSchema = new Schema<PublicationDoc>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "Profile", required: true },
    title: { type: String, required: true, trim: true },
    authors: { type: [AuthorSchema], default: [] },
    venue: { type: String, default: "", trim: true },
    year: { type: Number, min: 1900, max: 2100 },
    doi: { type: String, default: "", trim: true },
    abstract: { type: String, default: "", trim: true },
    tags: { type: [String], default: [] },
    fileUrl: { type: String, default: "", trim: true },
    fileMime: { type: String, default: "", trim: true },
    fileSize: { type: Number, default: 0, min: 0 },
    featured: { type: Boolean, default: false },
    readsCount: { type: Number, default: 0 },
    downloadsCount: { type: Number, default: 0 },
    citationsCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

PublicationSchema.index({ owner: 1, year: -1 });
PublicationSchema.index(
  { title: "text", abstract: "text" },
  {
    name: "papers_text_idx",
    weights: { title: 10, abstract: 5 },
    default_language: "english",
  },
);

export const PublicationModel: mongoose.Model<PublicationDoc> =
  (mongoose.models.Publication as mongoose.Model<PublicationDoc> | undefined) ??
  mongoose.model<PublicationDoc>("Publication", PublicationSchema);
