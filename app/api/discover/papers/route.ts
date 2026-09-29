import { z } from "zod";
import { ok, withApi } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { PublicationModel } from "@/models/publication";

const querySchema = z.object({
  q: z.string().trim().max(200).default(""),
  tag: z.string().trim().max(60).default(""),
  venue: z.string().trim().max(200).default(""),
  yearFrom: z.coerce.number().int().min(1900).max(2100).optional(),
  yearTo: z.coerce.number().int().min(1900).max(2100).optional(),
  sort: z.enum(["relevance", "newest", "cited"]).default("relevance"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/** Filterable paper discovery. Public. */
export const GET = withApi(async (req) => {
  const params = querySchema.parse(
    Object.fromEntries(new URL(req.url).searchParams),
  );
  await connectDB();

  const filter: Record<string, unknown> = {};
  if (params.tag) filter.tags = params.tag.toLowerCase();
  if (params.venue) filter.venue = params.venue;
  if (params.yearFrom != null || params.yearTo != null) {
    filter.year = {
      ...(params.yearFrom != null ? { $gte: params.yearFrom } : {}),
      ...(params.yearTo != null ? { $lte: params.yearTo } : {}),
    };
  }
  const useScore = params.q.length >= 2;
  if (useScore) filter.$text = { $search: params.q };

  const skip = (params.page - 1) * params.limit;
  const query = PublicationModel.find(
    filter,
    useScore ? { score: { $meta: "textScore" } } : {},
  );
  if (params.sort === "relevance" && useScore) query.sort({ score: { $meta: "textScore" } });
  else if (params.sort === "cited") query.sort({ citationsCount: -1 });
  else query.sort({ year: -1, createdAt: -1 });

  const [items, total] = await Promise.all([
    query.skip(skip).limit(params.limit).lean(),
    PublicationModel.countDocuments(filter),
  ]);

  return ok({
    items,
    total,
    page: params.page,
    pages: Math.max(1, Math.ceil(total / params.limit)),
  });
});
