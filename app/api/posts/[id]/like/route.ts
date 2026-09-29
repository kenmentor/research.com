import { auth } from "@/auth";
import { ApiError, handleApiError, notFound, ok, withApi } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { LikeModel } from "@/models/like";
import { PostModel } from "@/models/post";
import { ProfileModel } from "@/models/profile";

async function ids(userId: string) {
  await connectDB();
  const me = await ProfileModel.findOne({ userId }).select("_id").lean();
  if (!me) throw new ApiError(409, "NO_PROFILE", "Complete onboarding first.");
  return String(me._id);
}

function postId(ctx: { params: Promise<Record<string, string | string[]>> }) {
  return ctx.params.then((p) => {
    const raw = p.id;
    return Array.isArray(raw) ? raw[0] : raw;
  });
}

/** Like — idempotent (second tap keeps a single like). */
export const POST = withApi(async (_req, ctx) => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));
  const id = await postId(ctx);
  const mine = await ids(session.user.id);
  if (!(await PostModel.exists({ _id: id }))) throw notFound("Post not found");

  const res = await LikeModel.updateOne(
    { post: id, profile: mine },
    { $setOnInsert: { post: id, profile: mine } },
    { upsert: true },
  );
  if (res.upsertedCount > 0) {
    await PostModel.updateOne({ _id: id }, { $inc: { likesCount: 1 } });
  }
  return ok({ liked: true });
});

/** Unlike. */
export const DELETE = withApi(async (_req, ctx) => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));
  const id = await postId(ctx);
  const mine = await ids(session.user.id);

  const res = await LikeModel.deleteOne({ post: id, profile: mine });
  if (res.deletedCount > 0) {
    await PostModel.updateOne({ _id: id }, { $inc: { likesCount: -1 } });
  }
  return ok({ liked: false });
});
