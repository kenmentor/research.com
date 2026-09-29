import { z } from "zod";
import type { SortOrder } from "mongoose";
import { auth } from "@/auth";
import { ApiError, handleApiError, notFound, ok, withApi } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { publicationCreateSchema } from "@/lib/validators/publication";
import { ProfileModel } from "@/models/profile";
import { PublicationModel } from "@/models/publication";

const listQuery = z.object({
  ownerId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  q: z.string().trim().max(200).default(""),
  yearFrom: z.coerce.number().int().min(1900).max(2100).optional(),
  yearTo: z.coerce.number().int().min(1900).max(2100).optional(),
  venue: z.string().trim().max(200).default(""),
  tag: z.string().trim().max(60).default(""),
  sort: z.enum(["newest", "cited"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

/** Paginated, filterable publication list. Public. */
export const GET = withApi(async (req) => {
  const params = listQuery.parse(Object.fromEntries(new URL(req.url).searchParams));
  await connectDB();

  const filter: Record<string, unknown> = {};
  if (params.ownerId) filter.owner = params.ownerId;
  if (params.venue) filter.venue = params.venue;
  if (params.tag) filter.tags = params.tag.toLowerCase();
  if (params.yearFrom != null || params.yearTo != null) {
    filter.year = {
      ...(params.yearFrom != null ? { $gte: params.yearFrom } : {}),
      ...(params.yearTo != null ? { $lte: params.yearTo } : {}),
    };
  }
  if (params.q) filter.$text = { $search: params.q };

  const sort: Record<string, SortOrder> =
    params.sort === "cited"
      ? { citationsCount: -1, createdAt: -1 }
      : { year: -1, createdAt: -1 };

  const skip = (params.page - 1) * params.limit;
  const [items, total] = await Promise.all([
    PublicationModel.find(filter).sort(sort).skip(skip).limit(params.limit).lean(),
    PublicationModel.countDocuments(filter),
  ]);

  return ok({
    items,
    total,
    page: params.page,
    pages: Math.max(1, Math.ceil(total / params.limit)),
  });
});

/** Create a publication for your own profile. */
export const POST = withApi(async (req) => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));
  const body = publicationCreateSchema.parse(await req.json());

  await connectDB();
  const me = await ProfileModel.findOne({ userId: session.user.id })
    .select("_id displayName")
    .lean();
  if (!me) throw new ApiError(409, "NO_PROFILE", "Complete onboarding first.");

  // Auto-link authors whose name exactly matches a profile display name.
  const authors = await Promise.all(
    body.authors.map(async (a) => {
      if (a.profileId) return a;
      const match = await ProfileModel.findOne({ displayName: a.name })
        .select("_id")
        .lean();
      return { name: a.name, profileId: match ? String(match._id) : undefined };
    }),
  );

  if (body.featured) {
    await PublicationModel.updateMany({ owner: me._id }, { $set: { featured: false } });
  }

  const created = await PublicationModel.create({
    owner: me._id,
    ...body,
    authors,
  });
  return ok({ id: String(created._id) }, 201);
});
