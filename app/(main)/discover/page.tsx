import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader, SectionHeading } from "@/components/common/page-header";
import { PageShell } from "@/components/common/page-shell";
import { SubNav } from "@/components/common/sub-nav";
import { PaperRow } from "@/components/common/paper-row";
import { PersonRow } from "@/components/common/person-row";
import { EmptyState } from "@/components/common/states";
import { connectDB } from "@/lib/db";
import { blockedIds } from "@/lib/network";
import { auth } from "@/auth";
import { ProfileModel } from "@/models/profile";
import { PublicationModel } from "@/models/publication";
import { trendingTags } from "@/lib/search";

export const metadata = {
  title: "Discover researchers and papers",
  description:
    "Search the network for researchers, filter by institution and field, and browse publications by topic, venue, and year.",
};

/**
 * Discover hub.
 *
 * This used to be `redirect("/discover/people")`, which meant the entry
 * point threw away the query string and gave a first-time visitor no
 * way to browse by field. It is now a real landing surface: one search
 * entry point, a live topic index, and both recent feeds.
 */
export default async function DiscoverPage() {
  await connectDB();

  const session = await auth().catch(() => null);
  const viewer = session?.user
    ? await ProfileModel.findOne({ userId: session.user.id })
        .select("_id")
        .lean()
    : null;
  const hidden = viewer ? await blockedIds(String(viewer._id)) : [];

  const notHidden = hidden.length ? { _id: { $nin: hidden } } : {};
  const notHiddenPubs = hidden.length
    ? { author: { $nin: hidden } }
    : {};

  const [topics, papers, people] = await Promise.all([
    trendingTags(12).catch(() => []),
    PublicationModel.find(notHiddenPubs)
      .sort({ citationsCount: -1, readsCount: -1 })
      .limit(4)
      .lean(),
    ProfileModel.find(notHidden)
      .sort({ createdAt: -1 })
      .limit(4)
      .select("username displayName headline affiliation interests")
      .lean(),
  ]);

  return (
    <PageShell gap="lg">
      <PageHeader
        eyebrow="Discover"
        title="Find researchers and their work"
        description="Search the network by name, institution, or field — then filter publications by topic, venue, and year."
      />

      {/* Single search entry point. Submits straight to the people
          explorer; the topic chips below cover the papers path. */}
      <Card className="bg-brand-soft/40 ring-primary/20">
        <CardContent className="py-5">
          <form
            action="/discover/people"
            method="get"
            className="flex flex-col gap-2.5 sm:flex-row"
          >
            <label htmlFor="discover-q" className="sr-only">
              Search researchers
            </label>
            <div className="relative min-w-0 flex-1">
              <Search
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2"
                aria-hidden
              />
              <Input
                id="discover-q"
                name="q"
                placeholder="Name, headline, institution, or research interest…"
                className="h-11 bg-card pr-3 pl-11"
              />
            </div>
            <Button size="lg" type="submit" className="h-11 sm:px-6">
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      <SubNav
        items={[
          { href: "/discover/people", label: "Researchers" },
          { href: "/discover/papers", label: "Papers" },
        ]}
      />

      {topics.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionHeading
            title="Browse by topic"
            description="Fields researchers here are publishing in right now."
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

      <section className="flex flex-col gap-3">
        <SectionHeading
          title="Most cited papers"
          action={
            <Button variant="ghost" size="sm" render={<Link href="/discover/papers?sort=cited" />}>
              See all <ArrowRight className="size-3.5" />
            </Button>
          }
        />
        {papers.length === 0 ? (
          <EmptyState
            title="No papers yet"
            description="Publications will appear here as researchers add them."
            secondaryAction={
              <Button variant="outline" render={<Link href="/discover/people" />}>
                Browse researchers
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {papers.map((p) => (
              <PaperRow key={String(p._id)} paper={{ ...p, _id: String(p._id) }} showAbstract />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeading
          title="New to the network"
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
                }}
              />
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
