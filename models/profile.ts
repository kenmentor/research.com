import mongoose, { Schema, type Types } from "mongoose";
import type { NotificationType } from "./notification";

export type ProfileVisibility = "public" | "connections";

export interface ExperienceEntry {
  title: string;
  organization: string;
  start: string;
  end?: string;
  current: boolean;
  description: string;
}

export interface EducationEntry {
  school: string;
  degree: string;
  field: string;
  startYear?: number;
  endYear?: number;
}

export interface GrantEntry {
  title: string;
  funder: string;
  year?: number;
  amount?: string;
}

export type ProfileSection = "about" | "interests" | "experience" | "education" | "grants";

export interface ProfileDoc extends mongoose.Document {
  userId: Types.ObjectId;
  username: string;
  displayName: string;
  headline: string;
  affiliation: string;
  location: string;
  bio: string;
  interests: string[];
  avatarUrl: string;
  coverUrl: string;
  visibility: ProfileVisibility;
  sectionVisibility: Record<ProfileSection, ProfileVisibility>;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  grants: GrantEntry[];
  connectionsCount: number;
  followersCount: number;
  followingCount: number;
  citationsCount: number;
  readsCount: number;
  profileViews: number;
  completeness: number;
  lastActiveAt?: Date;
  /** Per-type notification opt-outs. Absent key = enabled. */
  notificationPrefs: Partial<Record<NotificationType, boolean>>;
  /** Populated by Mongoose `timestamps: true`. */
  createdAt: Date;
  updatedAt: Date;
}

const ExperienceSchema = new Schema<ExperienceEntry>(
  {
    title: { type: String, required: true, trim: true },
    organization: { type: String, required: true, trim: true },
    start: { type: String, required: true, trim: true },
    end: { type: String, trim: true },
    current: { type: Boolean, default: false },
    description: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const EducationSchema = new Schema<EducationEntry>(
  {
    school: { type: String, required: true, trim: true },
    degree: { type: String, required: true, trim: true },
    field: { type: String, default: "", trim: true },
    startYear: { type: Number, min: 1900, max: 2100 },
    endYear: { type: Number, min: 1900, max: 2100 },
  },
  { _id: false },
);

const GrantSchema = new Schema<GrantEntry>(
  {
    title: { type: String, required: true, trim: true },
    funder: { type: String, required: true, trim: true },
    year: { type: Number, min: 1900, max: 2100 },
    amount: { type: String, trim: true },
  },
  { _id: false },
);

const ProfileSchema = new Schema<ProfileDoc>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9_.-]+$/,
    },
    displayName: { type: String, required: true, trim: true },
    headline: { type: String, default: "", trim: true },
    affiliation: { type: String, default: "", trim: true },
    location: { type: String, default: "", trim: true },
    bio: { type: String, default: "", trim: true },
    interests: { type: [String], default: [] },
    avatarUrl: { type: String, default: "", trim: true },
    coverUrl: { type: String, default: "", trim: true },
    visibility: {
      type: String,
      enum: ["public", "connections"],
      default: "public",
    },
    sectionVisibility: {
      type: Object,
      default: {
        about: "public",
        interests: "public",
        experience: "public",
        education: "public",
        grants: "public",
      },
    },
    experience: { type: [ExperienceSchema], default: [] },
    education: { type: [EducationSchema], default: [] },
    grants: { type: [GrantSchema], default: [] },
    connectionsCount: { type: Number, default: 0 },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    citationsCount: { type: Number, default: 0 },
    readsCount: { type: Number, default: 0 },
  profileViews: { type: Number, default: 0 },
  completeness: { type: Number, default: 0, min: 0, max: 100 },
  /** Presence heartbeat (messaging). Online = active within 90s. */
  lastActiveAt: { type: Date },
    /**
     * Per-type notification opt-outs. Absent key = enabled.
     * Keys: connect_request, connect_accept, message, cite, mention.
     */
    notificationPrefs: { type: Object, default: {} },
  },
  { timestamps: true },
);

ProfileSchema.index({ username: 1 }, { unique: true });
ProfileSchema.index({ userId: 1 }, { unique: true });
ProfileSchema.index(
  { displayName: "text", headline: "text", interests: "text" },
  {
    name: "profiles_text_idx",
    weights: { displayName: 10, headline: 5, interests: 3 },
    default_language: "english",
  },
);

export const ProfileModel: mongoose.Model<ProfileDoc> =
  (mongoose.models.Profile as mongoose.Model<ProfileDoc> | undefined) ??
  mongoose.model<ProfileDoc>("Profile", ProfileSchema);
