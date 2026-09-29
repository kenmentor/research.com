import { auth } from "@/auth";
import { ApiError, handleApiError, notFound, ok, withApi } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { presenceChannel } from "@/lib/realtime";
import { ProfileModel } from "@/models/profile";
import Pusher from "pusher";

/** Authorize Pusher private + presence channels for participants. */
export const POST = withApi(async (req) => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));
  const { socket_id, channel_name } = (await req.json()) as {
    socket_id?: string;
    channel_name?: string;
  };
  if (!socket_id || !channel_name) {
    throw new ApiError(400, "BAD_AUTH", "Missing socket or channel.");
  }

  const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } = process.env;
  if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) {
    throw new ApiError(503, "REALTIME_OFF", "Realtime not configured.");
  }

  await connectDB();
  const me = await ProfileModel.findOne({ userId: session.user.id })
    .select("_id displayName")
    .lean();
  if (!me) throw new ApiError(409, "NO_PROFILE", "Complete onboarding first.");
  const mine = String(me._id);

  const pusher = new Pusher({
    appId: PUSHER_APP_ID,
    key: PUSHER_KEY,
    secret: PUSHER_SECRET,
    cluster: PUSHER_CLUSTER,
    useTLS: true,
  });

  if (channel_name === presenceChannel()) {
    return ok(
      pusher.authorizeChannel(socket_id, channel_name, {
        user_id: mine,
        user_info: { name: me.displayName },
      }) as unknown as Record<string, unknown>,
    );
  }

  const convMatch = /^private-conv-([0-9a-fA-F]{24})$/.exec(channel_name);
  if (!convMatch) throw new ApiError(403, "FORBIDDEN", "Unknown channel.");
  const { ConversationModel } = await import("@/models/conversation");
  const isMember = await ConversationModel.exists({
    _id: convMatch[1],
    participants: mine,
  });
  if (!isMember) throw new ApiError(403, "FORBIDDEN", "Not a participant.");

  return ok(
    pusher.authorizeChannel(socket_id, channel_name) as unknown as Record<string, unknown>,
  );
});
