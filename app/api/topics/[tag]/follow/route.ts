import { auth } from "@/auth";
import { ApiError, handleApiError, notFound, ok, withApi } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { ProfileModel } from "@/models/profile";
import { TopicFollowModel } from "@/models/topic-follow";

function tagOf(ctx: { params: Promise<Record<string, string | string[]>> }) {
  return ctx.params.then((p) => {
    const raw = p.tag;
    return decodeURIComponent(Array.isArray(raw) ? raw[0] : raw).toLowerCase();
  });
}

async function ownId(userId: string) {
  await connectDB();
  const me = await ProfileModel.findOne({ userId }).select("_id").lean();
  if (!me) throw new ApiError(409, "NO_PROFILE", "Complete onboarding first.");
  return String(me._id);
}

/** Follow a topic. Idempotent. */
export const POST = withApi(async (_req, ctx) => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));
  const tag = await tagOf(ctx);
  const mine = await ownId(session.user.id);

  await TopicFollowModel.updateOne(
    { profile: mine, tag },
    { $setOnInsert: { profile: mine, tag } },
    { upsert: true },
  );
  const followers = await TopicFollowModel.countDocuments({ tag });
  return ok({ following: true, followers });
});

/** Unfollow a topic. */
export const DELETE = withApi(async (_req, ctx) => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));
  const tag = await tagOf(ctx);
  const mine = await ownId(session.user.id);

  await TopicFollowModel.deleteOne({ profile: mine, tag });
  const followers = await TopicFollowModel.countDocuments({ tag });
  return ok({ following: false, followers });
});
