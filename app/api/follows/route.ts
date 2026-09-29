import { z } from "zod";
import { auth } from "@/auth";
import { ApiError, handleApiError, notFound, ok, withApi } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { FollowModel } from "@/models/follow";
import { ProfileModel } from "@/models/profile";

const bodySchema = z.object({ followingId: z.string().min(1) });

/** Follow a researcher. Idempotent. */
export const POST = withApi(async (req) => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));
  const { followingId } = bodySchema.parse(await req.json());

  await connectDB();
  const me = await ProfileModel.findOne({ userId: session.user.id })
    .select("_id")
    .lean();
  if (!me) throw new ApiError(409, "NO_PROFILE", "Complete onboarding first.");
  if (String(me._id) === followingId) {
    throw new ApiError(400, "SELF_FOLLOW", "You cannot follow yourself.");
  }
  const target = await ProfileModel.exists({ _id: followingId });
  if (!target) throw notFound("Researcher not found");

  const res = await FollowModel.updateOne(
    { follower: me._id, following: followingId },
    { $setOnInsert: { follower: me._id, following: followingId } },
    { upsert: true },
  );
  if (res.upsertedCount > 0) {
    await ProfileModel.updateOne({ _id: me._id }, { $inc: { followingCount: 1 } });
    await ProfileModel.updateOne({ _id: followingId }, { $inc: { followersCount: 1 } });
  }
  return ok({ following: true }, 201);
});

/** Unfollow. */
export const DELETE = withApi(async (req) => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));
  const { followingId } = bodySchema.parse(await req.json());

  await connectDB();
  const me = await ProfileModel.findOne({ userId: session.user.id })
    .select("_id")
    .lean();
  if (me) {
    const res = await FollowModel.deleteOne({ follower: me._id, following: followingId });
    if (res.deletedCount > 0) {
      await ProfileModel.updateOne({ _id: me._id }, { $inc: { followingCount: -1 } });
      await ProfileModel.updateOne({ _id: followingId }, { $inc: { followersCount: -1 } });
    }
  }
  return ok({ following: false });
});
