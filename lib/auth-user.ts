import { connectDB } from "./db";
import { UserModel } from "@/models/user";

/**
 * Find-or-create the auth User row for an email. Idempotent — safe to
 * call on every sign-in (OAuth first login, Credentials authorize).
 */
export async function syncUserByEmail(email: string, name?: string, image?: string) {
  await connectDB();
  const normalized = email.toLowerCase().trim();
  return UserModel.findOneAndUpdate(
    { email: normalized },
    {
      $set: {
        ...(name ? { name } : {}),
        ...(image ? { image } : {}),
      },
      $setOnInsert: { email: normalized },
    },
    { upsert: true, returnDocument: "after" },
  ).exec();
}
