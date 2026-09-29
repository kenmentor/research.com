import { z } from "zod";
import { auth } from "@/auth";
import { ApiError, handleApiError, notFound, ok, withApi } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { emailTemplates, sendEmail } from "@/lib/email";
import { isBlockedEitherWay } from "@/lib/network";
import { notify, profileEmail } from "@/lib/notify";
import { ConnectionModel, connectionPairKey } from "@/models/connection";
import { ProfileModel } from "@/models/profile";

async function ownProfileId(userId: string) {
  const me = await ProfileModel.findOne({ userId }).select("_id").lean();
  if (!me) throw new ApiError(409, "NO_PROFILE", "Complete onboarding first.");
  return String(me._id);
}

const targetSchema = z.object({ recipientId: z.string().min(1) });
const otherSchema = z.object({ otherId: z.string().min(1) });

/**
 * Send (or re-send after decline) a connection request. Idempotent per
 * pair — single pending state, no duplicate edges.
 */
export const POST = withApi(async (req) => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));
  const { recipientId } = targetSchema.parse(await req.json());

  await connectDB();
  const mine = await ownProfileId(session.user.id);
  if (mine === recipientId) {
    throw new ApiError(400, "SELF_CONNECT", "You cannot connect with yourself.");
  }
  const recipient = await ProfileModel.exists({ _id: recipientId });
  if (!recipient) throw notFound("Researcher not found");
  if (await isBlockedEitherWay(mine, recipientId)) {
    throw new ApiError(403, "BLOCKED", "Connection not allowed.");
  }

  const pairKey = connectionPairKey(mine, recipientId);
  const existing = await ConnectionModel.findOne({ pairKey });
  if (existing) {
    if (existing.status === "declined") {
      // Re-request: reset to pending from the new sender.
      existing.status = "pending";
      existing.requester = mine as unknown as typeof existing.requester;
      existing.recipient = recipientId as unknown as typeof existing.recipient;
      await existing.save();
      return ok({ status: "pending" });
    }
    return ok({ status: existing.status });
  }

  const created = await ConnectionModel.create({
    requester: mine,
    recipient: recipientId,
    status: "pending",
    pairKey,
  });
  // Notify the recipient (in-app + email digest candidate).
  const sender = await ProfileModel.findById(mine).select("displayName").lean();
  void notify({ recipient: recipientId, type: "connect_request", actor: mine });
  void (async () => {
    const to = await profileEmail(recipientId);
    if (to && sender) {
      await sendEmail({ ...emailTemplates.connectRequest(sender.displayName), to });
    }
  })();
  return ok({ status: created.status }, 201);
});

/** Accept or decline an incoming request (recipient only). */
export const PATCH = withApi(async (req) => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));
  const { otherId, action } = otherSchema
    .extend({ action: z.enum(["accept", "decline"]) })
    .parse(await req.json());

  await connectDB();
  const mine = await ownProfileId(session.user.id);
  const edge = await ConnectionModel.findOne({
    pairKey: connectionPairKey(mine, otherId),
    status: "pending",
    recipient: mine,
  });
  if (!edge) throw notFound("Request not found");

  edge.status = action === "accept" ? "accepted" : "declined";
  await edge.save();
  if (action === "accept") {
    await ProfileModel.updateMany(
      { _id: { $in: [mine, otherId] } },
      { $inc: { connectionsCount: 1 } },
    );
    void notify({
      recipient: otherId,
      type: "connect_accept",
      actor: mine,
    });
  }
  return ok({ status: edge.status });
});

/**
 * Withdraw your pending request, or remove an accepted connection
 * (either side). Declined rows stay as history.
 */
export const DELETE = withApi(async (req) => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));
  const { otherId } = otherSchema.parse(await req.json());

  await connectDB();
  const mine = await ownProfileId(session.user.id);
  const edge = await ConnectionModel.findOne({
    pairKey: connectionPairKey(mine, otherId),
  });
  if (!edge) throw notFound("Connection not found");

  const isRequester = String(edge.requester) === mine;
  if (edge.status === "pending" && !isRequester) {
    throw new ApiError(403, "FORBIDDEN", "Only the sender can withdraw.");
  }
  if (edge.status === "declined") throw notFound("Connection not found");

  await edge.deleteOne();
  if (edge.status === "accepted") {
    await ProfileModel.updateMany(
      { _id: { $in: [mine, otherId] } },
      { $inc: { connectionsCount: -1 } },
    );
  }
  return ok({ removed: true });
});
