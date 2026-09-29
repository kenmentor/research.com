import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageHeader } from "@/components/common/page-header";
import { PageShell } from "@/components/common/page-shell";
import { SettingsForm } from "@/components/auth/settings-form";
import { NotificationPrefs } from "@/components/settings/notification-prefs";
import { connectDB } from "@/lib/db";
import { ProfileModel } from "@/models/profile";

export const metadata = {
  title: "Settings",
  description: "Update your profile, notification preferences, and session.",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/settings");

  await connectDB();
  const profile = await ProfileModel.findOne({ userId: session.user.id }).lean();
  if (!profile) redirect("/onboarding");

  return (
    <PageShell gap="lg">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="How you appear across the network, and what you hear about."
      />
      <SettingsForm
        email={session.user.email ?? ""}
        defaults={{
          displayName: profile.displayName,
          username: profile.username,
          headline: profile.headline,
          affiliation: profile.affiliation,
          interests: profile.interests,
          bio: profile.bio,
          location: profile.location,
        }}
      />
      <NotificationPrefs
        initial={JSON.parse(
          JSON.stringify(profile.notificationPrefs ?? {}),
        ) as Record<string, boolean>}
      />
    </PageShell>
  );
}
