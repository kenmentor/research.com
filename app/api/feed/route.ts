import { auth } from "@/auth";
import { ApiError, handleApiError, notFound, ok, withApi } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { decodeCursor, encodeCursor, rankFeedPool } from "@/lib/feed";
import { LikeModel } from "@/models/like";
import { PostModel } from "@/models/post";
import { ProfileModel } from "@/models/profile";
import { SaveModel } from "@/models/save";
import { z } from "zod";

const querySchema = z.object({
  cursor: z.string().max(500).default(""),
  limit: z.coerce.number().int().min(1).max(30).default(10),
});

/** Ranked home feed with opaque cursor pagination. */
export const GET = withApi(async (req) => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));
  const { cursor, limit } = querySchema.parse(
    Object.fromEntries(new URL(req.url).searchParams),
  );

  await connectDB();
  const me = await ProfileModel.findOne({ userId: session.user.id })
    .select("_id")
    .lean();
  if (!me) throw new ApiError(409, "NO_PROFILE", "Complete onboarding first.");
  const mine = String(me._id);

  const ranked = await rankFeedPool(mine);
  let start = 0;
  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (!decoded) throw new ApiError(400, "BAD_CURSOR", "Invalid cursor.");
    const idx = ranked.findIndex((r) => r.id === decoded.id);
    start = idx === -1 ? 0 : idx + 1;
  }
  const page = ranked.slice(start, start + limit);
  const nextCursor =
    start + limit < ranked.length ? encodeCursor(page[page.length - 1]) : null;

  const posts = (await PostModel.find({ _id: { $in: page.map((p) => p.id) } })
    .populate("author", "username displayName headline avatarUrl")
    .populate("publicationId", "title venue year")
    .populate("repostOf", "body")
    .lean()) as unknown as Array<Record<string, unknown>>;

  const byId = new Map(posts.map((p) => [String(p._id), p]));
  const ordered = page.map((p) => byId.get(p.id)).filter((p) => p != null);

  const [likes, saves] = await Promise.all([
    LikeModel.find({ profile: mine, post: { $in: page.map((p) => p.id) } })
      .select("post")
      .lean(),
    SaveModel.find({ profile: mine, post: { $in: page.map((p) => p.id) } })
      .select("post")
      .lean(),
  ]);
  const liked = new Set(likes.map((l) => String(l.post)));
  const saved = new Set(saves.map((s) => String(s.post)));

  return ok({
    items: ordered.map((p) => ({
      ...p,
      _id: String(p._id),
      author: p.author as { username: string; displayName: string; headline: string },
      liked: liked.has(String(p._id)),
      saved: saved.has(String(p._id)),
    })),
    nextCursor,
  });
});
