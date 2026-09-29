import { z } from "zod";
import { auth } from "@/auth";
import { ApiError, handleApiError, notFound, ok, withApi } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { notify } from "@/lib/notify";
import { broadcast } from "@/lib/realtime";
import { ConversationModel } from "@/models/conversation";
import { MessageModel } from "@/models/message";
import { ProfileModel } from "@/models/profile";

const bodySchema = z.object({
  body: z.string().trim().min(1, "Write a message first.").max(2000),
});

async function threadOf(id: string, userId: string) {
  await connectDB();
  const me = await ProfileModel.findOne({ userId }).select("_id").lean();
  if (!me) throw new ApiError(409, "NO_PROFILE", "Complete onboarding first.");
  const mine = String(me._id);
  const thread = await ConversationModel.findOne({ _id: id, participants: mine });
  if (!thread) throw notFound("Conversation not found");
  return { thread, mine };
}

function idOf(ctx: { params: Promise<Record<string, string | string[]>> }) {
  return ctx.params.then((p) => {
    const raw = p.id;
    return Array.isArray(raw) ? raw[0] : raw;
  });
}

/**
 * Thread history (ascending, paginated). `?open=1` marks the other's
 * messages read; otherwise they advance sent → delivered.
 * Any fetch refreshes the viewer's presence heartbeat.
 */
export const GET = withApi(async (req, ctx) => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));
  const id = await idOf(ctx);
  const params = new URL(req.url).searchParams;
  const limit = Math.min(50, Math.max(1, Number(params.get("limit") ?? 50)));
  const before = params.get("before");
  const open = params.get("open") === "1";

  const { thread, mine } = await threadOf(id, session.user.id);
  await ProfileModel.updateOne({ _id: mine }, { $set: { lastActiveAt: new Date() } });

  const filter: Record<string, unknown> = { conversationId: thread._id };
  if (before) filter.createdAt = { $lt: new Date(before) };
  const docs = await MessageModel.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  const items = docs.reverse();

  if (open) {
    await MessageModel.updateMany(
      { conversationId: thread._id, sender: { $ne: mine }, state: { $ne: "read" } },
      { $set: { state: "read" } },
    );
  } else {
    await MessageModel.updateMany(
      { conversationId: thread._id, sender: { $ne: mine }, state: "sent" },
      { $set: { state: "delivered" } },
    );
  }
  if (items.some((m) => String(m.sender) !== mine)) {
    void broadcast(String(thread._id), "message:read", { by: mine });
  }

  return ok({
    items: items.map((m) => ({
      _id: String(m._id),
      sender: String(m.sender),
      body: m.body,
      state: open && String(m.sender) !== mine ? "read" : m.state,
      createdAt: m.createdAt,
    })),
    status: thread.status,
  });
});

/**
 * Send: persist first, broadcast second (201 + id). In `requested`
 * threads only the requester may write until the other side accepts.
 */
export const POST = withApi(async (req, ctx) => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));
  const id = await idOf(ctx);
  const { body } = bodySchema.parse(await req.json());

  const { thread, mine } = await threadOf(id, session.user.id);
  if (
    thread.status === "requested" &&
    thread.requestedBy != null &&
    String(thread.requestedBy) !== mine
  ) {
    throw new ApiError(403, "THREAD_REQUESTED", "Accept the request before replying.");
  }

  const created = await MessageModel.create({
    conversationId: thread._id,
    sender: mine,
    body,
    state: "sent",
  });
  thread.lastMessageAt = new Date();
  await thread.save();

  const payload = {
    _id: String(created._id),
    sender: mine,
    body,
    state: "sent" as const,
    createdAt: created.createdAt,
  };
  void broadcast(String(thread._id), "message:new", payload);
  const otherId = (thread.participants as unknown as Array<{ toString(): string }>)
    .map(String)
    .find((p) => p !== mine);
  if (otherId) {
    void notify({
      recipient: otherId,
      type: "message",
      actor: mine,
      targetKind: "conversation",
      targetId: String(thread._id),
    });
  }
  return ok(payload, 201);
});
