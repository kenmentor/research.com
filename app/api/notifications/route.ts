import { z } from "zod";
import { auth } from "@/auth";
import { ApiError, handleApiError, notFound, ok, withApi } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { NotificationModel } from "@/models/notification";
import { ProfileModel } from "@/models/profile";

const querySchema = z.object({
  filter: z.enum(["all", "unread"]).default("all"),
  type: z.string().trim().max(40).default(""),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/** Bell/page list with unread count. Newest first. */
export const GET = withApi(async (req) => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));
  const params = querySchema.parse(
    Object.fromEntries(new URL(req.url).searchParams),
  );

  await connectDB();
  const me = await ProfileModel.findOne({ userId: session.user.id })
    .select("_id")
    .lean();
  if (!me) throw new ApiError(409, "NO_PROFILE", "Complete onboarding first.");

  const filter: Record<string, unknown> = { recipient: me._id };
  if (params.filter === "unread") filter.read = false;
  if (params.type) filter.type = params.type;

  const skip = (params.page - 1) * params.limit;
  const [items, total, unreadCount] = await Promise.all([
    NotificationModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(params.limit)
      .populate("actor", "username displayName avatarUrl")
      .lean(),
    NotificationModel.countDocuments(filter),
    NotificationModel.countDocuments({ recipient: me._id, read: false }),
  ]);

  return ok({
    items: items.map((n) => ({
      _id: String(n._id),
      type: n.type,
      actor: n.actor
        ? {
            username: (n.actor as unknown as { username: string }).username,
            displayName: (n.actor as unknown as { displayName: string }).displayName,
          }
        : null,
      targetKind: n.targetKind,
      targetId: n.targetId ? String(n.targetId) : null,
      read: n.read,
      createdAt: n.createdAt,
    })),
    total,
    unreadCount,
    page: params.page,
    pages: Math.max(1, Math.ceil(total / params.limit)),
  });
});
