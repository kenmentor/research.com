import { auth } from "@/auth";
import { ApiError, handleApiError, notFound, ok, withApi } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { ProfileModel } from "@/models/profile";

/** Presence heartbeat (30s interval from open clients). */
export const POST = withApi(async () => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));

  await connectDB();
  const me = await ProfileModel.findOneAndUpdate(
    { userId: session.user.id },
    { $set: { lastActiveAt: new Date() } },
  )
    .select("_id")
    .lean();
  if (!me) throw new ApiError(409, "NO_PROFILE", "Complete onboarding first.");
  return ok({ active: true });
});
