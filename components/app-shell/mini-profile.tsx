import Link from "next/link";
import { auth } from "@/auth";
import { ProfileAvatar } from "@/components/common/profile-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { connectDB } from "@/lib/db";
import { initialsOf } from "@/lib/profile";
import { ProfileModel } from "@/models/profile";

/** Left-rail identity card. Anonymous visitors get a sign-in prompt. */
export async function MiniProfile() {
  const session = await auth();
  if (!session?.user) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-5 text-center">
          <p className="font-heading text-base font-semibold">Join the conversation</p>
          <p className="text-muted-foreground text-sm">
            Sign in to publish, connect, and follow researchers.
          </p>
          <Button className="mt-1 w-full" render={<Link href="/login">Sign in</Link>} />
        </CardContent>
      </Card>
    );
  }

  await connectDB();
  const profile = await ProfileModel.findOne({ userId: session.user.id })
    .select("username displayName headline avatarUrl")
    .lean();
  if (!profile) return null;

  return (
    <Card className="overflow-hidden">
      <div className="bg-primary/10 h-14" aria-hidden />
      <CardContent className="-mt-6 flex flex-col items-center text-center">
        <ProfileAvatar
          src={profile.avatarUrl}
          alt={profile.displayName}
          initials={initialsOf(profile.displayName)}
          className="border-card ring-border size-14 ring-2"
          fallbackClassName="text-sm font-medium"
        />
        <Link
          href={`/in/${profile.username}`}
          className="font-heading hover:text-primary mt-2.5 text-base font-semibold transition-colors"
        >
          {profile.displayName}
        </Link>
        <p className="text-muted-foreground line-clamp-2 text-xs">
          {profile.headline || "Add a headline to introduce your work."}
        </p>
      </CardContent>
    </Card>
  );
}
