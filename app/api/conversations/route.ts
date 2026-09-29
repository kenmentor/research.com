import { z } from "zod";
import { auth } from "@/auth";
import { ApiError, handleApiError, notFound, ok, withApi } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { isBlockedEitherWay } from "@/lib/network";
import { ConversationModel, conversationPairKey } from "@/models/conversation";
import { MessageModel } from "@/models/message";
import { ProfileModel } from "@/models/profile";

async function ownId(userId: string) {
  await connectDB();
  const me = await ProfileModel.findOne({ userId }).select("_id").lean();
  if (!me) throw new ApiError(409, "NO_PROFILE", "Complete onboarding first.");
  return String(me._id);
}

const boxSchema = z.object({ box: z.enum(["inbox", "requests"]).default("inbox") });

/**
 * Conversation list, sorted by lastMessageAt desc, with per-thread
 * unread counts + last-message preview. `?box=requests` = stranger asks.
 */
export const GET = withApi(async (req) => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));
  const { box } = boxSchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  const mine = await ownId(session.user.id);

  const status = box === "requests" ? "requested" : "active";
  const threads = await ConversationModel.find({ participants: mine, status })
    .sort({ lastMessageAt: -1 })
    .populate("participants", "username displayName headline avatarUrl lastActiveAt")
    .lean();

  const items = await Promise.all(
    threads.map(async (t) => {
      const other = (t.participants as unknown as Array<{ _id: unknown; username: string; displayName: string; headline: string; avatarUrl?: string; lastActiveAt?: string }>).find(
        (p) => String(p._id) !== mine,
      );
      const [last, unread] = await Promise.all([
        MessageModel.findOne({ conversationId: t._id }).sort({ createdAt: -1 }).select("body sender createdAt").lean(),
        MessageModel.countDocuments({
          conversationId: t._id,
          sender: { $ne: mine },
          state: { $ne: "read" },
        }),
      ]);
      return {
        _id: String(t._id),
        status: t.status,
        other,
        lastMessageAt: t.lastMessageAt,
        lastMessage: last
          ? { body: last.body.slice(0, 120), sender: String(last.sender), createdAt: last.createdAt }
          : null,
        unread,
        mineRequested: t.requestedBy != null && String(t.requestedBy) === mine,
      };
    }),
  );

  return ok({ items, totalUnread: items.reduce((n, t) => n + t.unread, 0) });
});

/**
 * Ensure a 1-1 thread: one conversation per pair (unique pairKey).
 * Connected pairs open `active`; strangers land in `requested`.
 */
export const POST = withApi(async (req) => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));
  const { otherId } = z.object({ otherId: z.string().min(1) }).parse(await req.json());
  const mine = await ownId(session.user.id);

  if (mine === otherId) {
    throw new ApiError(400, "SELF_CHAT", "You cannot message yourself.");
  }
  const target = await ProfileModel.exists({ _id: otherId });
  if (!target) throw notFound("Researcher not found");
  if (await isBlockedEitherWay(mine, otherId)) {
    throw new ApiError(403, "BLOCKED", "Messaging not allowed.");
  }

  const pairKey = conversationPairKey(mine, otherId);
  const existing = await ConversationModel.findOne({ pairKey }).lean();
  if (existing) return ok({ id: String(existing._id), status: existing.status });

  const { connectedIds } = await import("@/lib/network");
  const connected = (await connectedIds(mine)).includes(otherId);
  const created = await ConversationModel.create({
    pairKey,
    participants: [mine, otherId],
    status: connected ? "active" : "requested",
    ...(connected ? {} : { requestedBy: mine }),
  });
  return ok({ id: String(created._id), status: created.status }, 201);
});
