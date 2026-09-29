import { z } from "zod";
import { auth } from "@/auth";
import { ok, withApi } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { blockedIds } from "@/lib/network";
import { trendingTags } from "@/lib/search";
import { PostModel } from "@/models/post";
import { ProfileModel } from "@/models/profile";
import { PublicationModel } from "@/models/publication";
import { SearchLogModel } from "@/models/search-log";

const querySchema = z.object({
  q: z.string().trim().max(200).default(""),
  limit: z.coerce.number().int().min(1).max(10).default(5),
});

/** Fire-and-forget query log with 1-minute per-user dedupe (spam guard). */
async function logQuery(q: string, profileId: string | null) {
  try {
    const since = new Date(Date.now() - 60_000);
    const dupe = await SearchLogModel.exists({
      q,
      ...(profileId ? { profileId } : { profileId: { $exists: false } }),
      createdAt: { $gte: since },
    });
    if (!dupe) await SearchLogModel.create({ q, ...(profileId ? { profileId } : {}) });
  } catch {
    /* logging never breaks search */
  }
}

/** Grouped global search: people, papers, posts, topics. Public. */
export const GET = withApi(async (req) => {
  const { q, limit } = querySchema.parse(
    Object.fromEntries(new URL(req.url).searchParams),
  );
  await connectDB();

  const session = await auth().catch(() => null);
  const viewer = session?.user
    ? await ProfileModel.findOne({ userId: session.user.id }).select("_id").lean()
    : null;
  const viewerId = viewer ? String(viewer._id) : null;
  const hidden = new Set(viewerId ? await blockedIds(viewerId) : []);

  if (q.length >= 2) {
    void logQuery(q.toLowerCase(), viewerId);
  }

  if (q.length < 2) {
    // Empty/short: trending topics + recent entities, no collection scan.
    const trending = await trendingTags(5);
    const [recentPubs, recentPeople] = await Promise.all([
      PublicationModel.find({}).sort({ createdAt: -1 }).limit(limit).select("title venue year").lean(),
      ProfileModel.find(hidden.size ? { _id: { $nin: [...hidden] } } : {})
        .sort({ createdAt: -1 })
        .limit(limit)
        .select("username displayName headline avatarUrl")
        .lean(),
    ]);
    return ok({ people: recentPeople, papers: recentPubs, posts: [], topics: trending });
  }

  const authorFilter = hidden.size
    ? { author: { $nin: [...hidden] } }
    : {};
  const profileFilter = hidden.size ? { _id: { $nin: [...hidden] } } : {};

  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const [people, papers, posts, tagAgg] = await Promise.all([
    ProfileModel.find({ $text: { $search: q }, ...profileFilter }, { score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" } })
      .limit(limit)
      .select("username displayName headline avatarUrl")
      .lean(),
    PublicationModel.find({ $text: { $search: q } }, { score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" }, citationsCount: -1 })
      .limit(limit)
      .select("title venue year citationsCount tags")
      .lean(),
    PostModel.find({ body: { $regex: esc(q), $options: "i" }, ...authorFilter })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("body author createdAt")
      .populate("author", "username displayName avatarUrl")
      .lean(),
    PublicationModel.aggregate<{ _id: string; count: number }>([
      { $match: { tags: { $regex: esc(q), $options: "i" } } },
      { $unwind: "$tags" },
      { $match: { tags: { $regex: esc(q), $options: "i" } } },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]),
  ]);

  return ok({
    people,
    papers,
    posts: posts.map((p) => ({
      _id: String(p._id),
      body: p.body.slice(0, 140),
      createdAt: p.createdAt,
      author: p.author,
    })),
    topics: tagAgg.map((t) => ({ tag: t._id, papers: t.count })),
  });
});

