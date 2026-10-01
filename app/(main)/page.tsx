import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BookOpen, Quote, Search, Sparkles, UserPlus, Users } from "lucide-react";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/common/page-header";
import { PageShell } from "@/components/common/page-shell";
import { EmptyState } from "@/components/common/states";
import { PaperRow } from "@/components/common/paper-row";
import { PersonRow } from "@/components/common/person-row";
import { connectDB } from "@/lib/db";
import { profileComplete } from "@/lib/profile";
import { trendingTags } from "@/lib/search";
import { HomeFeed } from "@/components/feed/home-feed";
import { ProfileModel } from "@/models/profile";
import { PublicationModel } from "@/models/publication";

const PILLARS = [
  {
    icon: UserPlus,
    title: "Find your people",
    body: "Search by name, institution, or research interest, then connect directly.",
  },
  {
    icon: BookOpen,
    title: "Keep your work attached",
    body: "Publication records live on your profile, not buried in a CV you have to re-upload.",
  },
  {
    icon: Quote,
    title: "Track what lands",
    body: "Citations, reads, and views in one place — signal without the self-reporting.",
  },
  {
    icon: Users,
    title: "Discuss the work",
    body: "A feed for sharing results and asking questions of people in your field.",
  },
];

/**
 * Home.
 *
 * Signed out, this is the product's front door and it was a single
 * card with one paragraph and no way to see the product or start
 * looking. It now lands on a real value proposition, a working search
 * entry point, live topic/paper/researcher previews, and a direct path
 * to sign in.
 */
export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    await connectDB();
    const [topics, papers, people] = await Promise.all([
      trendingTags(10).catch(() => []),
      PublicationModel.find({})
        .sort({ citationsCount: -1, readsCount: -1 })
        .limit(3)
        .lean(),
      ProfileModel.find({})
        .sort({ createdAt: -1 })
        .limit(3)
        .select("username displayName headline affiliation interests")
        .lean(),
    ]);

    return (
      <PageShell gap="lg">
        {/* Hero */}
        <section className="flex flex-col gap-5 py-2 sm:py-4">
          <div className="max-w-2xl space-y-3">
            <p className="text-primary text-sm font-semibold tracking-wide uppercase">
              For researchers
            </p>
            <h1 className="font-heading text-3xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-4xl">
              A professional network for the people doing the research.
            </h1>
            <p className="text-muted-foreground max-w-prose text-base leading-relaxed text-pretty">
              Find collaborators, keep your publications attached to your
              profile, and follow the work in your field.
            </p>
          </div>

          {/* Working search, same target the discover hub uses. */}
          <Card className="bg-brand-soft/40 ring-primary/20">
            <CardContent className="py-4">
              <form
                action="/discover/people"
                method="get"
                className="flex flex-col gap-2.5 sm:flex-row"
              >
                <label htmlFor="home-q" className="sr-only">
                  Search researchers
                </label>
                <div className="relative min-w-0 flex-1">
                  <Search
                    className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2"
                    aria-hidden
                  />
                  <Input
                    id="home-q"
                    name="q"
                    placeholder="Name, headline, institution, or research interest…"
                    className="bg-card h-11 pr-3 pl-11"
                  />
                </div>
                <Button size="lg" type="submit" className="h-11 sm:px-6">
                  Search
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <Button size="lg" render={<Link href="/login" />} className="sm:px-6">
              Join the network <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<Link href="/discover" />}
              className="sm:px-6"
            >
              Browse first
            </Button>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <SectionHeading title="What you get" />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map(({ icon: Icon, title, body }) => (
              <li key={title}>
                <Card className="h-full">
                  <CardContent className="flex gap-3">
                    <span className="bg-brand-soft text-brand-soft-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                      <Icon className="size-4.5" aria-hidden />
                    </span>
                    <div className="min-w-0 space-y-1">
                      <h3 className="text-sm font-semibold">{title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {body}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        {topics.length > 0 && (
          <section className="flex flex-col gap-3">
            <SectionHeading
              title="Active fields"
              description="What researchers here are publishing in right now."
            />
            <ul className="flex flex-wrap gap-2">
              {topics.map((t) => (
                <li key={t.tag}>
                  <Link
                    href={`/discover/papers?tag=${encodeURIComponent(t.tag)}`}
                    className="bg-card text-foreground ring-border hover:bg-accent hover:ring-primary/40 inline-flex items-baseline gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition-colors"
                  >
                    {t.tag}
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {t.count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Papers and people sit side by side rather than as two tall stacked
            sections — one glance instead of a long scroll. */}
        <section className="grid gap-6 md:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-3">
            <SectionHeading
              title="Most cited papers"
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  render={<Link href="/discover/papers?sort=cited" />}
                >
                  See all <ArrowRight className="size-3.5" />
                </Button>
              }
            />
            {papers.length === 0 ? (
              <EmptyState
                title="No papers yet"
                description="Publications appear here as researchers add them."
                icon={Sparkles}
              />
            ) : (
              <div className="flex flex-col gap-2.5">
                {papers.map((p) => (
                  <PaperRow key={String(p._id)} paper={{ ...p, _id: String(p._id) }} />
                ))}
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-3">
            <SectionHeading
              title="Researchers to know"
              action={
                <Button variant="ghost" size="sm" render={<Link href="/discover/people" />}>
                  See all <ArrowRight className="size-3.5" />
                </Button>
              }
            />
            {people.length === 0 ? (
              <EmptyState
                title="No researchers yet"
                description="Be the first to join and start building your profile."
                secondaryAction={
                  <Button render={<Link href="/login" />}>Join the network</Button>
                }
              />
            ) : (
              <div className="flex flex-col gap-2.5">
                {people.map((p) => (
                  <PersonRow
                    key={String(p._id)}
                    person={{
                      _id: String(p._id),
                      username: p.username,
                      displayName: p.displayName,
                      headline: p.headline,
                      affiliation: p.affiliation,
                      interests: p.interests ?? [],
                      avatarUrl: p.avatarUrl || undefined,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </PageShell>
    );
  }

  await connectDB();
  const profile = await ProfileModel.findOne({ userId: session.user.id }).lean();
  if (!profile || !profileComplete(profile)) redirect("/onboarding");

  return (
    <HomeFeed
      displayName={profile.displayName}
      avatarUrl={profile.avatarUrl || undefined}
      ownerId={String(profile._id)}
    />
  );
}
