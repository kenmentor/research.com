import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { OnboardingWizard } from "@/components/auth/onboarding-wizard";
import { connectDB } from "@/lib/db";
import { profileComplete } from "@/lib/profile";
import { ProfileModel } from "@/models/profile";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/onboarding");

  await connectDB();
  const existing = await ProfileModel.findOne({ userId: session.user.id }).lean();
  if (existing && profileComplete(existing)) redirect("/");

  return (
    <OnboardingWizard
      defaults={
        existing
          ? {
              displayName: existing.displayName,
              headline: existing.headline,
              affiliation: existing.affiliation,
              interests: existing.interests,
              bio: existing.bio,
              location: existing.location,
            }
          : { displayName: session.user.name ?? "" }
      }
    />
  );
}
