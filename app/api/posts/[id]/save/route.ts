import { auth } from "@/auth";
import { ApiError, handleApiError, notFound, ok, withApi } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { PostModel } from "@/models/post";
import { ProfileModel } from "@/models/profile";
import { SaveModel } from "@/models/save";

async function ownId(userId: string) {
  await connectDB();
  const me = await ProfileModel.findOne({ userId }).select("_id").lean();
  if (!me) throw new ApiError(409, "NO_PROFILE", "Complete onboarding first.");
  return String(me._id);
}

async function postId(ctx: { params: Promise<Record<string, string | string[]>> }) {
  const p = await ctx.params;
  return Array.isArray(p.id) ? p.id[0] : p.id;
}

/** Save — idempotent. */
export const POST = withApi(async (_req, ctx) => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));
  const id = await postId(ctx);
  const mine = await ownId(session.user.id);
  if (!(await PostModel.exists({ _id: id }))) throw notFound("Post not found");

  await SaveModel.updateOne(
    { post: id, profile: mine },
    { $setOnInsert: { post: id, profile: mine } },
    { upsert: true },
  );
  return ok({ saved: true });
});

/** Unsave. */
export const DELETE = withApi(async (_req, ctx) => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));
  const id = await postId(ctx);
  const mine = await ownId(session.user.id);

  await SaveModel.deleteOne({ post: id, profile: mine });
  return ok({ saved: false });
});
