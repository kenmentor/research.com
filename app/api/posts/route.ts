import { z } from "zod";
import { auth } from "@/auth";
import { ApiError, handleApiError, notFound, ok, withApi } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { postCreateSchema } from "@/lib/validators/post";
import { ProfileModel } from "@/models/profile";
import { PostModel } from "@/models/post";
import { PublicationModel } from "@/models/publication";

/** Create a text/link/image/paper post — or a quote-repost. */
export const POST = withApi(async (req) => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));
  const body = postCreateSchema.parse(await req.json());

  await connectDB();
  const me = await ProfileModel.findOne({ userId: session.user.id })
    .select("_id")
    .lean();
  if (!me) throw new ApiError(409, "NO_PROFILE", "Complete onboarding first.");

  if (body.publicationId) {
    const paper = await PublicationModel.exists({ _id: body.publicationId });
    if (!paper) throw new ApiError(400, "BAD_PAPER", "Attached paper not found.");
  }

  let repostOf: string | undefined;
  if (body.repostOf) {
    const original = await PostModel.findByIdAndUpdate(body.repostOf, {
      $inc: { repostsCount: 1 },
    });
    if (!original) throw new ApiError(400, "BAD_REPOST", "Original post not found.");
    repostOf = body.repostOf;
  }

  const created = await PostModel.create({
    author: me._id,
    body: body.body,
    linkUrl: body.linkUrl,
    imageUrl: body.imageUrl,
    publicationId: body.publicationId,
    ...(repostOf ? { repostOf } : {}),
  });
  return ok({ id: String(created._id) }, 201);
});

/** Latest own posts (used by the composer paper picker via publications API instead). */
export const GET = withApi(async (req) => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));
  const mine = z
    .object({ mine: z.string().optional() })
    .parse(Object.fromEntries(new URL(req.url).searchParams));

  await connectDB();
  const me = await ProfileModel.findOne({ userId: session.user.id })
    .select("_id")
    .lean();
  if (!me) throw new ApiError(409, "NO_PROFILE", "Complete onboarding first.");

  const items = await PostModel.find(mine.mine ? { author: me._id } : {})
    .sort({ createdAt: -1 })
    .limit(20)
    .select("_id body createdAt")
    .lean();
  return ok({ items });
});
