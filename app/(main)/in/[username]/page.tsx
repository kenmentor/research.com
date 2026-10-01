import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { ProfileActions } from "@/components/profile/profile-actions";
import { PublicationsTab } from "@/components/publications/publications-tab";
import { ProfileSections, type SerializedProfile } from "@/components/profile/profile-sections";
import { StatsRail } from "@/components/profile/stats-rail";
import { connectDB } from "@/lib/db";
import { isBlockedEitherWay, mutualCount } from "@/lib/network";
import { computeCompleteness, initialsOf } from "@/lib/profile";
import { BlockModel } from "@/models/block";
import { ConnectionModel, connectionPairKey } from "@/models/connection";
import { FollowModel } from "@/models/follow";
import { ProfileModel, type ProfileSection } from "@/models/profile";
import { PublicationModel } from "@/models/publication";
import type { ConnectionState } from "@/components/profile/profile-header";

function canView(
  section: ProfileSection,
  visibility: Partial<Record<ProfileSection, string>> | undefined,
  isOwner: boolean,
  isConnected: boolean,
): boolean {
  if (isOwner) return true;
  const rule = visibility?.[section] ?? "public";
  if (rule === "public") return true;
  return isConnected;
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  await connectDB();

  const profile = await ProfileModel.findOne({ username }).lean();
  if (!profile) notFound();

  const session = await auth();
  const viewer =
    session?.user != null
      ? await ProfileModel.findOne({ userId: session.user.id }).select("_id").lean()
      : null;
  const viewerId = viewer ? String(viewer._id) : null;
  const profileId = String(profile._id);
  const isOwner = viewerId === profileId;

  // Blocks hide profiles both ways (spec: invisible per action rules).
  if (viewerId && !isOwner && (await isBlockedEitherWay(viewerId, profileId))) {
    notFound();
  }

  let connectionState: ConnectionState = "none";
  let isConnected = false;
  let following = false;
  let blockedByMe = false;
  let mutuals = 0;
  if (viewerId && !isOwner) {
    const edge = await ConnectionModel.findOne({
      pairKey: connectionPairKey(viewerId, profileId),
    }).lean();
    if (edge?.status === "accepted") {
      connectionState = "connected";
      isConnected = true;
    } else if (edge?.status === "pending") {
      connectionState =
        String(edge.requester) === viewerId ? "pending-sent" : "pending-received";
    }
    following = Boolean(
      await FollowModel.exists({ follower: viewerId, following: profileId }),
    );
    blockedByMe = Boolean(
      await BlockModel.exists({ blocker: viewerId, blocked: profileId }),
    );
    mutuals = await mutualCount(viewerId, profileId);
  }

  if (!isOwner) {
    await ProfileModel.updateOne({ _id: profile._id }, { $inc: { profileViews: 1 } });
  }

  const visible: Record<ProfileSection, boolean> = {
    about: canView("about", profile.sectionVisibility, isOwner, isConnected),
    interests: canView("interests", profile.sectionVisibility, isOwner, isConnected),
    experience: canView("experience", profile.sectionVisibility, isOwner, isConnected),
    education: canView("education", profile.sectionVisibility, isOwner, isConnected),
    grants: canView("grants", profile.sectionVisibility, isOwner, isConnected),
  };

  // Redact hidden sections BEFORE serializing: restricted data must never
  // reach the client (RSC flight props are readable). `visible` still
  // controls rendering — this is defense in depth.
  const serialized: SerializedProfile = JSON.parse(
    JSON.stringify({
      username: profile.username,
      displayName: profile.displayName,
      headline: profile.headline,
      affiliation: profile.affiliation,
      location: profile.location,
      bio: visible.about ? profile.bio : "",
      interests: visible.interests ? profile.interests : [],
      experience: visible.experience ? (profile.experience ?? []) : [],
      education: visible.education ? (profile.education ?? []) : [],
      grants: visible.grants ? (profile.grants ?? []) : [],
      // Older docs predate sectionVisibility — default each key explicitly.
      sectionVisibility: {
        about: profile.sectionVisibility?.about ?? "public",
        interests: profile.sectionVisibility?.interests ?? "public",
        experience: profile.sectionVisibility?.experience ?? "public",
        education: profile.sectionVisibility?.education ?? "public",
        grants: profile.sectionVisibility?.grants ?? "public",
      },
      visible,
    }),
  );

  const suggestions = await ProfileModel.find({
    _id: { $ne: profile._id },
    $or: [{ affiliation: profile.affiliation }, { interests: { $in: profile.interests } }],
  })
    .select("username displayName headline")
    .limit(5)
    .lean();

  const publicationCount = await PublicationModel.countDocuments({ owner: profile._id });
  const completeness = computeCompleteness(
    JSON.parse(JSON.stringify(profile)) as Record<string, unknown>,
  );

  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_18rem] xl:gap-6">
      <div className="flex min-w-0 flex-col gap-4">
        <ProfileActions
          profileId={profileId}
          displayName={profile.displayName}
          headline={profile.headline}
          affiliation={profile.affiliation}
          location={profile.location}
          initials={initialsOf(profile.displayName)}
          avatarUrl={profile.avatarUrl || undefined}
          interests={visible.interests ? (profile.interests ?? []) : []}
          verified={false}
          mutuals={mutuals}
          isOwner={isOwner}
          initialConnection={connectionState}
          initialFollowing={following}
          initialBlocked={blockedByMe}
        />

        {/* Section nav. "Activity" was removed: it rendered a
            placeholder reading "will appear here in Phase 7" long
            after the feed shipped. Two real tabs beat three with a
            dead one. */}
        <div className="border-border no-scrollbar -mx-1 flex gap-1 overflow-x-auto border-b px-1">
          <Link
            href="#about"
            className="text-foreground border-primary -mb-px shrink-0 border-b-2 px-3 py-2 text-sm font-medium"
          >
            About
          </Link>
          <Link
            href="#publications"
            className="text-muted-foreground hover:text-foreground hover:border-primary -mb-px shrink-0 border-b-2 border-transparent px-3 py-2 text-sm font-medium transition-colors"
          >
            Publications
            {publicationCount > 0 && (
              <span className="text-muted-foreground ml-1.5 text-xs tabular-nums">
                {publicationCount}
              </span>
            )}
          </Link>
        </div>

        <section id="about" className="scroll-mt-20">
          <ProfileSections profile={serialized} isOwner={isOwner} />
        </section>

        <section id="publications" className="scroll-mt-20">
          <PublicationsTab ownerId={profileId} isOwner={isOwner} />
        </section>
      </div>

      <StatsRail
        stats={{
          connections: profile.connectionsCount,
          followers: profile.followersCount,
          citations: profile.citationsCount,
          reads: profile.readsCount,
          views: profile.profileViews + (isOwner ? 0 : 1),
        }}
        completeness={isOwner ? completeness : undefined}
        suggestions={JSON.parse(JSON.stringify(suggestions))}
        isOwner={isOwner}
      />
    </div>
  );
}
