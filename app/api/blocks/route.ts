import { z } from "zod";
import { auth } from "@/auth";
import { ApiError, handleApiError, notFound, ok, withApi } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { BlockModel } from "@/models/block";
import { ConnectionModel, connectionPairKey } from "@/models/connection";
import { FollowModel } from "@/models/follow";
import { ProfileModel } from "@/models/profile";

const bodySchema = z.object({ blockedId: z.string().min(1) });

async function ownProfileId(userId: string) {
  const me = await ProfileModel.findOne({ userId }).select("_id").lean();
  if (!me) throw new ApiError(409, "NO_PROFILE", "Complete onboarding first.");
  return String(me._id);
}

/**
 * Block a researcher: creates the block edge and severs connection +
 * follow edges both ways. Content hiding is enforced at read time
 * (profile, network, and later feed/search/messages).
 */
export const POST = withApi(async (req) => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));
  const { blockedId } = bodySchema.parse(await req.json());

  await connectDB();
  const mine = await ownProfileId(session.user.id);
  if (mine === blockedId) {
    throw new ApiError(400, "SELF_BLOCK", "You cannot block yourself.");
  }
  if (!(await ProfileModel.exists({ _id: blockedId }))) {
    throw notFound("Researcher not found");
  }

  await BlockModel.updateOne(
    { blocker: mine, blocked: blockedId },
    { $setOnInsert: { blocker: mine, blocked: blockedId } },
    { upsert: true },
  );
  const severed = await ConnectionModel.findOneAndDelete({
    pairKey: connectionPairKey(mine, blockedId),
  });
  if (severed?.status === "accepted") {
    await ProfileModel.updateMany(
      { _id: { $in: [mine, blockedId] } },
      { $inc: { connectionsCount: -1 } },
    );
  }
  await FollowModel.deleteMany({
    $or: [
      { follower: mine, following: blockedId },
      { follower: blockedId, following: mine },
    ],
  });
  return ok({ blocked: true }, 201);
});

/** Unblock. Severed edges are NOT restored. */
export const DELETE = withApi(async (req) => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));
  const { blockedId } = bodySchema.parse(await req.json());

  await connectDB();
  const mine = await ownProfileId(session.user.id);
  await BlockModel.deleteOne({ blocker: mine, blocked: blockedId });
  return ok({ blocked: false });
});

/** Your block list with profile snippets. */
export const GET = withApi(async () => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));

  await connectDB();
  const mine = await ownProfileId(session.user.id);
  const rows = await BlockModel.find({ blocker: mine })
    .populate("blocked", "username displayName headline")
    .lean();
  return ok({
    items: rows.map((r) => r.blocked),
  });
});
