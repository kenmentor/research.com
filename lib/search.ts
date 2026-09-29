import { PublicationModel } from "@/models/publication";
import { SearchLogModel } from "@/models/search-log";
import { TopicFollowModel } from "@/models/topic-follow";

export interface TrendingTag {
  tag: string;
  count: number;
}

/**
 * Top tags from query logs (24h), falling back to top publication tags
 * weighted by topic follows.
 *
 * Lives here rather than in the search route now that both the search
 * endpoint and the discover/home surfaces need it — importing an
 * aggregation out of a route handler couples every page to it.
 */
export async function trendingTags(limit = 10): Promise<TrendingTag[]> {
  const dayAgo = new Date(Date.now() - 24 * 3600 * 1000);
  const logged = await SearchLogModel.aggregate<{ _id: string; count: number }>([
    { $match: { createdAt: { $gte: dayAgo } } },
    { $group: { _id: "$q", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);
  if (logged.length > 0) return logged.map((l) => ({ tag: l._id, count: l.count }));

  const tags = await PublicationModel.aggregate<{ _id: string; count: number }>([
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);
  const follows = await TopicFollowModel.aggregate<{ _id: string; count: number }>([
    { $group: { _id: "$tag", count: { $sum: 1 } } },
  ]);
  const followByTag = new Map(follows.map((f) => [f._id, f.count]));
  return tags.map((t) => ({ tag: t._id, count: t.count + (followByTag.get(t._id) ?? 0) }));
}
