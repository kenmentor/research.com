import Link from "next/link";
import { auth } from "@/auth";
import { ProfileAvatar } from "@/components/common/profile-avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { connectDB } from "@/lib/db";
import { suggestionsFor } from "@/lib/network";
import { initialsOf } from "@/lib/profile";
import { ProfileModel } from "@/models/profile";
import { PublicationModel } from "@/models/publication";

/** Right rail: trending papers + suggested researchers (viewer-aware). */
export async function RightRail() {
  const session = await auth();
  await connectDB();

  const trending = await PublicationModel.find({})
    .sort({ citationsCount: -1, readsCount: -1 })
    .limit(5)
    .select("title venue citationsCount")
    .lean();

  let suggestions: Array<{
    username: string;
    displayName: string;
    headline: string;
    avatarUrl: string;
  }> = [];
  if (session?.user) {
    const me = await ProfileModel.findOne({ userId: session.user.id })
      .select("_id")
      .lean();
    if (me) suggestions = (await suggestionsFor(String(me._id), 5)).map((s) => ({
      username: s.username,
      displayName: s.displayName,
      headline: s.headline,
      avatarUrl: s.avatarUrl,
    }));
  }

  return (
    <aside
      className="sticky top-18 hidden w-80 shrink-0 flex-col gap-4 self-start xl:flex"
      aria-label="Discover"
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Trending papers</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col">
          {trending.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No papers yet — be the first to publish.
            </p>
          ) : (
            trending.map((p, i) => (
              <Link
                key={String(p._id)}
                href={`/pub/${String(p._id)}`}
                className="hover:bg-accent group -mx-2 flex gap-3 rounded-md px-2 py-2.5"
              >
                <span className="text-muted-foreground/70 w-4 shrink-0 pt-0.5 text-right text-xs font-medium tabular-nums">
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className="line-clamp-2 text-sm font-medium leading-snug group-hover:text-primary">
                    {p.title}
                  </span>
                  <span className="text-muted-foreground mt-1 block truncate text-xs">
                    {[p.venue, `${p.citationsCount} cites`].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Suggested researchers</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col">
          {suggestions.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {session?.user
                ? "Complete your profile to get suggestions."
                : "Sign in to see people you may know."}
            </p>
          ) : (
            suggestions.map((s) => (
              <Link
                key={s.username}
                href={`/in/${s.username}`}
                className="hover:bg-accent group -mx-2 flex items-center gap-2.5 rounded-md px-2 py-2"
              >
                <ProfileAvatar
                  src={s.avatarUrl}
                  alt={s.displayName}
                  initials={initialsOf(s.displayName)}
                  className="size-9"
                  fallbackClassName="text-xs font-medium"
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium group-hover:underline">
                    {s.displayName}
                  </span>
                  <span className="text-muted-foreground block truncate text-xs">
                    {s.headline}
                  </span>
                </span>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </aside>
  );
}
