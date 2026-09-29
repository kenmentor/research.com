import { auth } from "@/auth";
import { ok, withApi } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { blockedIds } from "@/lib/network";
import { PostModel } from "@/models/post";
import { ProfileModel } from "@/models/profile";
import { PublicationModel } from "@/models/publication";
import { TopicFollowModel } from "@/models/topic-follow";

function tagOf(ctx: { params: Promise<Record<string, string | string[]>> }) {
  return ctx.params.then((p) => {
    const raw = p.tag;
    return decodeURIComponent(Array.isArray(raw) ? raw[0] : raw).toLowerCase();
  });
}

/** Topic aggregate: header counts + papers + people + posts. Public. */
export const GET = withApi(async (_req, ctx) => {
  const tag = await tagOf(ctx);
  await connectDB();

  const session = await auth().catch(() => null);
  const viewer = session?.user
    ? await ProfileModel.findOne({ userId: session.user.id }).select("_id").lean()
    : null;
  const hidden = viewer ? await blockedIds(String(viewer._id)) : [];
  const profileFilter = hidden.length ? { _id: { $nin: hidden } } : {};

  const [papers, people, posts, followers, following] = await Promise.all([
    PublicationModel.find({ tags: tag })
      .sort({ citationsCount: -1 })
      .limit(10)
      .select("title venue year citationsCount")
      .lean(),
    ProfileModel.find({ interests: tag, ...profileFilter })
      .limit(10)
      .select("username displayName headline avatarUrl")
      .lean(),
    PostModel.find({ body: { $regex: tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("body author createdAt")
      .populate("author", "username displayName avatarUrl")
      .lean(),
    TopicFollowModel.countDocuments({ tag }),
    viewer
      ? TopicFollowModel.exists({ tag, profile: String(viewer._id) })
      : null,
  ]);

  const [paperCount, peopleCount] = await Promise.all([
    PublicationModel.countDocuments({ tags: tag }),
    ProfileModel.countDocuments({ interests: tag, ...profileFilter }),
  ]);

  return ok({
    tag,
    counts: {
      papers: paperCount,
      people: peopleCount,
      posts: posts.length,
      followers: followers,
    },
    following: Boolean(following),
    papers,
    people,
    posts: posts.map((p) => ({
      _id: String(p._id),
      body: p.body.slice(0, 200),
      createdAt: p.createdAt,
      author: p.author,
    })),
  });
});
