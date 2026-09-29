import { auth } from "@/auth";
import { handleApiError, notFound, ok, withApi } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { profilePatchSchema } from "@/lib/validators/profile";
import { ProfileModel } from "@/models/profile";

/** Owner-only partial profile update. All-or-nothing validation. */
export const PATCH = withApi(async (req) => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));

  const body = profilePatchSchema.parse(await req.json());
  await connectDB();

  const set: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined) continue;
    if (key === "sectionVisibility") {
      for (const [section, vis] of Object.entries(
        value as Record<string, string>,
      )) {
        set[`sectionVisibility.${section}`] = vis;
      }
    } else {
      set[key] = value;
    }
  }
  if (Object.keys(set).length === 0) {
    return handleApiError(notFound("Nothing to update"));
  }

  const profile = await ProfileModel.findOneAndUpdate(
    { userId: session.user.id },
    { $set: set },
    { returnDocument: "after" },
  ).lean();
  if (!profile) return handleApiError(notFound("Profile not found"));

  return ok({ username: profile.username });
});
