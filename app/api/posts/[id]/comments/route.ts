import { auth } from "@/auth";
import { ApiError, handleApiError, notFound, ok, withApi } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { commentCreateSchema } from "@/lib/validators/post";
import { CommentModel } from "@/models/comment";
import { PostModel } from "@/models/post";
import { ProfileModel } from "@/models/profile";

async function context(ctx: { params: Promise<Record<string, string | string[]>> }) {
  const p = await ctx.params;
  return Array.isArray(p.id) ? p.id[0] : p.id;
}

/** Latest comments, chronological. */
export const GET = withApi(async (req, ctx) => {
  const id = await context(ctx);
  const limit = Math.min(
    50,
    Math.max(1, Number(new URL(req.url).searchParams.get("limit") ?? 20)),
  );
  await connectDB();
  const items = await CommentModel.find({ post: id })
    .sort({ createdAt: 1 })
    .limit(limit)
    .populate("author", "username displayName avatarUrl")
    .lean();
  return ok({ items });
});

/** Comment (1–1000 chars); bumps the post counter. */
export const POST = withApi(async (req, ctx) => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));
  const id = await context(ctx);
  const { body } = commentCreateSchema.parse(await req.json());

  await connectDB();
  const me = await ProfileModel.findOne({ userId: session.user.id })
    .select("_id")
    .lean();
  if (!me) throw new ApiError(409, "NO_PROFILE", "Complete onboarding first.");
  if (!(await PostModel.exists({ _id: id }))) throw notFound("Post not found");

  const created = await CommentModel.create({ post: id, author: me._id, body });
  await PostModel.updateOne({ _id: id }, { $inc: { commentsCount: 1 } });
  return ok({ id: String(created._id) }, 201);
});
