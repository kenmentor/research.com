import mongoose, { Schema } from "mongoose";

export interface SearchLogDoc extends mongoose.Document {
  q: string;
  profileId?: string;
}

/** Raw query log for trending topics. TTL keeps 7 days. */
const SearchLogSchema = new Schema<SearchLogDoc>(
  {
    q: { type: String, required: true, trim: true, maxlength: 200 },
    profileId: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

SearchLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 3600 });
SearchLogSchema.index({ q: 1, createdAt: -1 });

export const SearchLogModel =
  (mongoose.models.SearchLog as mongoose.Model<SearchLogDoc> | undefined) ??
  mongoose.model<SearchLogDoc>("SearchLog", SearchLogSchema);
