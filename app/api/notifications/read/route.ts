import { z } from "zod";
import { auth } from "@/auth";
import { ApiError, handleApiError, notFound, ok, withApi } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { NotificationModel } from "@/models/notification";
import { ProfileModel } from "@/models/profile";

/** Mark read: explicit ids or all=true. Returns the new unread count. */
export const POST = withApi(async (req) => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));
  const { ids, all } = z
    .object({ ids: z.array(z.string()).max(100).default([]), all: z.boolean().default(false) })
    .parse(await req.json());

  await connectDB();
  const me = await ProfileModel.findOne({ userId: session.user.id })
    .select("_id")
    .lean();
  if (!me) throw new ApiError(409, "NO_PROFILE", "Complete onboarding first.");

  if (all) {
    await NotificationModel.updateMany({ recipient: me._id, read: false }, { $set: { read: true } });
  } else if (ids.length > 0) {
    await NotificationModel.updateMany(
      { recipient: me._id, _id: { $in: ids } },
      { $set: { read: true } },
    );
  }
  const unreadCount = await NotificationModel.countDocuments({
    recipient: me._id,
    read: false,
  });
  return ok({ unreadCount });
});
