import { z } from "zod";
import { auth } from "@/auth";
import { ApiError, handleApiError, notFound, ok, withApi } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { PostModel } from "@/models/post";
import { ProfileModel } from "@/models/profile";

/** Quote-repost with optional comment text. */
export const POST = withApi(async (req, ctx) => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));
  const p = await ctx.params;
  const id = Array.isArray(p.id) ? p.id[0] : p.id;
  const { quote } = z
    .object({ quote: z.string().trim().max(5000).default("") })
    .parse(await req.json());

  await connectDB();
  const me = await ProfileModel.findOne({ userId: session.user.id })
    .select("_id")
    .lean();
  if (!me) throw new ApiError(409, "NO_PROFILE", "Complete onboarding first.");

  const original = await PostModel.findByIdAndUpdate(id, {
    $inc: { repostsCount: 1 },
  });
  if (!original) throw notFound("Post not found");

  const created = await PostModel.create({
    author: me._id,
    body: quote,
    repostOf: id,
  });
  return ok({ id: String(created._id) }, 201);
});
