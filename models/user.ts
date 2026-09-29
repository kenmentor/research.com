import mongoose, { Schema } from "mongoose";

export interface UserDoc extends mongoose.Document {
  email: string;
  name?: string;
  image?: string;
  emailVerified?: Date | null;
}

const UserSchema = new Schema<UserDoc>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, trim: true },
    image: { type: String, trim: true },
    emailVerified: { type: Date, default: null },
  },
  { timestamps: true },
);

// Explicit unique index (kept as a single definition to avoid duplicates).
UserSchema.index({ email: 1 }, { unique: true });

export const UserModel: mongoose.Model<UserDoc> =
  (mongoose.models.User as mongoose.Model<UserDoc> | undefined) ??
  mongoose.model<UserDoc>("User", UserSchema);
