import { z } from "zod";
import { auth } from "@/auth";
import { ApiError, handleApiError, notFound, ok, withApi } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { ProfileModel } from "@/models/profile";
import type { NotificationType } from "@/models/notification";

const TYPES = [
  "connect_request",
  "connect_accept",
  "message",
  "cite",
  "mention",
  "digest",
] as const;

/** Current prefs (absent key = enabled). */
export const GET = withApi(async () => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));

  await connectDB();
  const me = await ProfileModel.findOne({ userId: session.user.id })
    .select("notificationPrefs")
    .lean();
  if (!me) throw new ApiError(409, "NO_PROFILE", "Complete onboarding first.");

  const prefs = (me.notificationPrefs ?? {}) as Record<string, boolean>;
  return ok({
    prefs: Object.fromEntries(TYPES.map((t) => [t, prefs[t] !== false])),
  });
});

/** Save prefs: { prefs: { <type>: boolean } }. */
export const PATCH = withApi(async (req) => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));
  const { prefs } = z
    .object({ prefs: z.record(z.string(), z.boolean()) })
    .parse(await req.json());

  await connectDB();
  const me = await ProfileModel.findOne({ userId: session.user.id }).select(
    "_id notificationPrefs",
  );
  if (!me) throw new ApiError(409, "NO_PROFILE", "Complete onboarding first.");

  const next: Record<string, boolean> = {
    ...((me.notificationPrefs ?? {}) as Record<string, boolean>),
  };
  for (const [type, enabled] of Object.entries(prefs)) {
    if ((TYPES as readonly string[]).includes(type)) next[type] = enabled;
  }
  me.notificationPrefs = next as unknown as typeof me.notificationPrefs;
  await me.save();

  const out = Object.fromEntries(
    TYPES.map((t) => [t, (next[t] ?? true) as boolean]),
  ) as Record<NotificationType | "digest", boolean>;
  return ok({ prefs: out });
});
