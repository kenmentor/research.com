import { auth } from "@/auth";
import { handleApiError, notFound, ok, withApi } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { publicationPatchSchema } from "@/lib/validators/publication";
import { ProfileModel } from "@/models/profile";
import { PublicationModel } from "@/models/publication";

async function ownedOr404(rawId: string | string[], userId: string) {
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  await connectDB();
  const me = await ProfileModel.findOne({ userId }).select("_id").lean();
  const doc = await PublicationModel.findById(id);
  if (!doc) throw notFound("Publication not found");
  if (!me || String(doc.owner) !== String(me._id)) {
    throw notFound("Publication not found");
  }
  return doc;
}

/** Single publication. Public; detail page increments reads separately. */
export const GET = withApi(async (_req, ctx) => {
  const { id: raw } = await ctx.params;
  const id = Array.isArray(raw) ? raw[0] : raw;
  await connectDB();
  const doc = await PublicationModel.findById(id).lean();
  if (!doc) return handleApiError(notFound("Publication not found"));
  return ok(doc);
});

/** Owner partial update. Featured=true unpins the owner's other pins. */
export const PATCH = withApi(async (req, ctx) => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));
  const { id } = await ctx.params;
  const body = publicationPatchSchema.parse(await req.json());
  const doc = await ownedOr404(id, session.user.id);

  if (body.featured === true) {
    await PublicationModel.updateMany(
      { owner: doc.owner, _id: { $ne: doc._id } },
      { $set: { featured: false } },
    );
  }
  for (const [key, value] of Object.entries(body)) {
    if (value !== undefined) (doc as unknown as Record<string, unknown>)[key] = value;
  }
  await doc.save();
  return ok({ id: String(doc._id) });
});

/** Owner delete. */
export const DELETE = withApi(async (_req, ctx) => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));
  const { id } = await ctx.params;
  const doc = await ownedOr404(id, session.user.id);
  await doc.deleteOne();
  return ok({ deleted: true });
});

/** Register a download event (client opens fileUrl afterwards). */
export const POST = withApi(async (_req, ctx) => {
  const { id: raw } = await ctx.params;
  const id = Array.isArray(raw) ? raw[0] : raw;
  await connectDB();
  const doc = await PublicationModel.findByIdAndUpdate(
    id,
    { $inc: { downloadsCount: 1 } },
    { returnDocument: "after" },
  )
    .select("fileUrl downloadsCount")
    .lean();
  if (!doc) return handleApiError(notFound("Publication not found"));
  return ok({ fileUrl: doc.fileUrl, downloadsCount: doc.downloadsCount });
});
