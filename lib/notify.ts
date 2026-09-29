import {
  NotificationModel,
  type NotificationTargetKind,
  type NotificationType,
} from "@/models/notification";
import { ProfileModel } from "@/models/profile";
import { UserModel } from "@/models/user";

/**
 * Create an in-app notification unless the recipient opted out of the
 * type (absent pref key = enabled). Fire-and-forget safe: never throws.
 */
export async function notify(input: {
  recipient: string;
  type: NotificationType;
  actor?: string;
  targetKind?: NotificationTargetKind;
  targetId?: string;
}): Promise<void> {
  try {
    const prefs = (
      await ProfileModel.findById(input.recipient).select("notificationPrefs").lean()
    )?.notificationPrefs as Record<string, boolean> | undefined;
    if (prefs?.[input.type] === false) return;
    await NotificationModel.create(input);
  } catch (error) {
    console.error("[notify] failed", error);
  }
}

/** Resolve a profile's login email for transactional mail. */
export async function profileEmail(profileId: string): Promise<string | null> {
  const profile = await ProfileModel.findById(profileId).select("userId").lean();
  if (!profile) return null;
  const user = await UserModel.findById(profile.userId).select("email").lean();
  return user?.email ?? null;
}
