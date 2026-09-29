import { handleApiError, notFound, ok, withApi } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { notify } from "@/lib/notify";
import { PublicationModel } from "@/models/publication";

/** Register a manual-citation event ("cited by" counter, V1). */
export const POST = withApi(async (_req, ctx) => {
  const { id: raw } = await ctx.params;
  const id = Array.isArray(raw) ? raw[0] : raw;
  await connectDB();
  const doc = await PublicationModel.findByIdAndUpdate(
    id,
    { $inc: { citationsCount: 1 } },
    { returnDocument: "after" },
  )
    .select("citationsCount owner")
    .lean();
  if (!doc) return handleApiError(notFound("Publication not found"));
  if (doc.owner) {
    void notify({ recipient: String(doc.owner), type: "cite", targetKind: "publication", targetId: id });
  }
  return ok({ citationsCount: doc.citationsCount });
});
