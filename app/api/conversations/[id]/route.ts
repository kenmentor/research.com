import { z } from "zod";
import { auth } from "@/auth";
import { ApiError, handleApiError, notFound, ok, withApi } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { broadcast } from "@/lib/realtime";
import { BlockModel } from "@/models/block";
import { ConversationModel } from "@/models/conversation";
import { MessageModel } from "@/models/message";
import { ProfileModel } from "@/models/profile";

function idOf(ctx: { params: Promise<Record<string, string | string[]>> }) {
  return ctx.params.then((p) => {
    const raw = p.id;
    return Array.isArray(raw) ? raw[0] : raw;
  });
}

/**
 * Accept / decline / block a message request. Only the recipient
 * (non-requester) of a `requested` thread may act.
 */
export const PATCH = withApi(async (req, ctx) => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));
  const id = await idOf(ctx);
  const { action } = z.object({ action: z.enum(["accept", "decline", "block"]) }).parse(await req.json());

  await connectDB();
  const me = await ProfileModel.findOne({ userId: session.user.id })
    .select("_id")
    .lean();
  if (!me) throw new ApiError(409, "NO_PROFILE", "Complete onboarding first.");
  const mine = String(me._id);

  const thread = await ConversationModel.findOne({ _id: id, participants: mine });
  if (!thread || thread.status !== "requested") throw notFound("Request not found");
  if (thread.requestedBy != null && String(thread.requestedBy) === mine) {
    throw new ApiError(403, "FORBIDDEN", "Only the recipient can respond.");
  }

  const other = (thread.participants as unknown as Array<{ toString(): string }>)
    .map(String)
    .find((p) => p !== mine);

  if (action === "accept") {
    thread.status = "active";
    thread.requestedBy = undefined;
    await thread.save();
    void broadcast(String(thread._id), "thread:update", { status: "active" });
    return ok({ status: "active" });
  }

  // Decline or block: remove the thread + history (no thread is created).
  await MessageModel.deleteMany({ conversationId: thread._id });
  await thread.deleteOne();
  if (action === "block" && other) {
    await BlockModel.updateOne(
      { blocker: mine, blocked: other },
      { $setOnInsert: { blocker: mine, blocked: other } },
      { upsert: true },
    );
  }
  return ok({ status: action === "block" ? "blocked" : "declined" });
});
