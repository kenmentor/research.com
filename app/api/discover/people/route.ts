import { z } from "zod";
import { auth } from "@/auth";
import { ok, withApi } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { blockedIds } from "@/lib/network";
import { ProfileModel } from "@/models/profile";

const querySchema = z.object({
  q: z.string().trim().max(200).default(""),
  institution: z.string().trim().max(160).default(""),
  field: z.string().trim().max(60).default(""),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/** Filterable people discovery. Public. */
export const GET = withApi(async (req) => {
  const params = querySchema.parse(
    Object.fromEntries(new URL(req.url).searchParams),
  );
  await connectDB();

  const session = await auth().catch(() => null);
  const viewer = session?.user
    ? await ProfileModel.findOne({ userId: session.user.id }).select("_id").lean()
    : null;
  const hidden = viewer ? await blockedIds(String(viewer._id)) : [];

  const filter: Record<string, unknown> = {};
  if (hidden.length) filter._id = { $nin: hidden };
  if (params.institution) filter.affiliation = params.institution;
  if (params.field) filter.interests = params.field.toLowerCase();
  if (params.q.length >= 2) filter.$text = { $search: params.q };

  const useScore = params.q.length >= 2;
  const skip = (params.page - 1) * params.limit;
  const query = ProfileModel.find(
    filter,
    useScore ? { score: { $meta: "textScore" } } : {},
  );
  if (useScore) query.sort({ score: { $meta: "textScore" } });
  else query.sort({ createdAt: -1 });

  const [items, total] = await Promise.all([
    query
      .skip(skip)
      .limit(params.limit)
      .select("username displayName headline affiliation interests avatarUrl")
      .lean(),
    ProfileModel.countDocuments(filter),
  ]);

  return ok({
    items,
    total,
    page: params.page,
    pages: Math.max(1, Math.ceil(total / params.limit)),
  });
});
