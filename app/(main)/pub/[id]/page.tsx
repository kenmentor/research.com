import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CiteBox } from "@/components/publications/cite-box";
import { DownloadButton } from "@/components/publications/download-button";
import { OwnerPubActions } from "@/components/publications/owner-pub-actions";
import { connectDB } from "@/lib/db";
import { initialsOf } from "@/lib/profile";
import { ProfileModel } from "@/models/profile";
import { PublicationModel } from "@/models/publication";

/** Paper titles belong in the tab, not "Researcher". */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  await connectDB();
  const pub = await PublicationModel.findById(id).select("title authors").lean();
  if (!pub) return { title: "Publication not found" };
  const by = pub.authors[0]?.name;
  return {
    title: pub.title,
    description: by ? `${by} et al.` : undefined,
  };
}

export default async function PublicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDB();

  const pub = await PublicationModel.findById(id).lean();
  if (!pub) notFound();

  const session = await auth();
  const viewer =
    session?.user != null
      ? await ProfileModel.findOne({ userId: session.user.id }).select("_id").lean()
      : null;
  const isOwner = viewer != null && String(viewer._id) === String(pub.owner);

  if (!isOwner) {
    await PublicationModel.updateOne({ _id: pub._id }, { $inc: { readsCount: 1 } });
  }

  const owner = await ProfileModel.findById(pub.owner)
    .select("username displayName headline")
    .lean();
  const linkedIds = pub.authors
    .map((a) => a.profileId)
    .filter((v): v is NonNullable<typeof v> => Boolean(v));
  const linked = linkedIds.length
    ? await ProfileModel.find({ _id: { $in: linkedIds } })
        .select("username displayName")
        .lean()
    : [];
  const usernameById = new Map(linked.map((p) => [String(p._id), p.username]));

  const authorNames = pub.authors.map((a) => a.name);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href="/discover/papers" />}
        className="-ml-2 self-start"
      >
        <ChevronLeft className="size-4" />
        All papers
      </Button>

      <article className="flex flex-col gap-5">
        <header className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-heading text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl">
              {pub.title}
            </h1>
            {isOwner && <OwnerPubActions pub={JSON.parse(JSON.stringify(pub))} />}
          </div>

          <p className="text-base leading-relaxed">
            {pub.authors.map((a, i) => {
              const uname = a.profileId ? usernameById.get(String(a.profileId)) : undefined;
              return (
                <span key={i}>
                  {i > 0 && ", "}
                  {uname ? (
                    <Link
                      href={`/in/${uname}`}
                      className="text-primary font-medium hover:underline"
                    >
                      {a.name}
                    </Link>
                  ) : (
                    a.name
                  )}
                </span>
              );
            })}
          </p>

          <p className="text-muted-foreground text-sm">
            {[pub.venue, pub.year, pub.doi && `DOI: ${pub.doi}`]
              .filter(Boolean)
              .join(" · ")}
          </p>

          {owner && (
            <Link
              href={`/in/${owner.username}`}
              className="hover:bg-accent/50 -mx-2 flex w-fit items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors"
            >
              <Avatar className="size-9">
                <AvatarFallback className="text-xs">
                  {initialsOf(owner.displayName)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">
                <span className="block font-medium">{owner.displayName}</span>
                <span className="text-muted-foreground block text-xs">
                  {owner.headline}
                </span>
              </span>
            </Link>
          )}
        </header>

        <dl className="border-border grid grid-cols-3 gap-3 rounded-lg border px-4 py-3">
          {[
            { label: "Citations", value: pub.citationsCount },
            // readsCount was already incremented above for non-owners.
            { label: "Reads", value: pub.readsCount + (isOwner ? 0 : 1) },
            { label: "Downloads", value: pub.downloadsCount },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <dt className="text-muted-foreground text-xs">{s.label}</dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums">
                {s.value.toLocaleString()}
              </dd>
            </div>
          ))}
        </dl>

        {pub.abstract && (
          <section aria-labelledby="abstract-heading" className="flex flex-col gap-2">
            <h2
              id="abstract-heading"
              className="text-muted-foreground text-xs font-semibold tracking-wide uppercase"
            >
              Abstract
            </h2>
            {/* Read at body size with a capped measure — the abstract is
                the reason to open this page, so it shouldn't be 14px. */}
            <p className="max-w-prose text-[0.975rem] leading-[1.75] whitespace-pre-line text-pretty">
              {pub.abstract}
            </p>
          </section>
        )}

        {pub.tags.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {pub.tags.map((t) => (
              <li key={t}>
                <Badge
                  variant="secondary"
                  render={<Link href={`/topics/${encodeURIComponent(t)}`} />}
                >
                  {t}
                </Badge>
              </li>
            ))}
          </ul>
        )}

        <DownloadButton pubId={id} hasFile={Boolean(pub.fileUrl)} />
      </article>

      <CiteBox
        meta={{
          title: pub.title,
          authors: authorNames,
          venue: pub.venue,
          year: pub.year,
          doi: pub.doi,
        }}
        pubId={id}
        canonicalUrl={`/pub/${id}`}
      />
    </div>
  );
}
