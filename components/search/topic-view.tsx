"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/common/page-header";
import { PageShell } from "@/components/common/page-shell";
import { PaperRow } from "@/components/common/paper-row";
import { PersonRow } from "@/components/common/person-row";
import { ProfileAvatar } from "@/components/common/profile-avatar";
import { initialsOf } from "@/lib/profile";
import { EmptyState, ErrorState, ResultSkeleton } from "@/components/common/states";

interface TopicData {
  tag: string;
  counts: { papers: number; people: number; posts: number; followers: number };
  following: boolean;
  papers: Array<{
    _id: string;
    title: string;
    venue: string;
    year?: number;
    citationsCount: number;
  }>;
  people: Array<{
    _id: string;
    username: string;
    displayName: string;
    headline: string;
    avatarUrl?: string;
  }>;
  posts: Array<{
    _id: string;
    body: string;
    author?: { username: string; displayName: string; avatarUrl?: string };
  }>;
}

export function TopicView({ tag }: { tag: string }) {
  const [data, setData] = useState<TopicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/topics/${encodeURIComponent(tag)}`);
        const json = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok) {
          throw new Error(json?.error?.message ?? "Could not load this topic.");
        }
        setData(json.data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load this topic.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tag, retry]);

  async function toggleFollow() {
    if (!data) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/topics/${encodeURIComponent(tag)}/follow`, {
        method: data.following ? "DELETE" : "POST",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message ?? "Sign in to follow topics.");
      setData({
        ...data,
        following: json.data.following,
        counts: { ...data.counts, followers: json.data.followers },
      });
      toast.success(json.data.following ? `Following #${tag}.` : `Unfollowed #${tag}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update follow.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <PageShell gap="lg">
        <div className="flex flex-col gap-2">
          <div className="bg-muted h-8 w-40 animate-pulse rounded-md" />
          <div className="bg-muted h-4 w-56 animate-pulse rounded-md" />
        </div>
        <ResultSkeleton count={4} />
      </PageShell>
    );
  }

  // Previously `return null` — a failed request left a blank page with
  // no way to recover short of a manual reload.
  if (error || !data) {
    return (
      <PageShell gap="lg">
        <ErrorState
          title={`Couldn't load #${tag}`}
          description={error ?? "This topic doesn't exist."}
          onRetry={() => setRetry((r) => r + 1)}
        />
      </PageShell>
    );
  }

  const isEmpty =
    data.papers.length === 0 && data.people.length === 0 && data.posts.length === 0;

  return (
    <PageShell gap="lg">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            #{data.tag}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {[
              `${data.counts.papers} ${data.counts.papers === 1 ? "paper" : "papers"}`,
              `${data.counts.people} ${data.counts.people === 1 ? "researcher" : "researchers"}`,
              `${data.counts.followers} ${data.counts.followers === 1 ? "follower" : "followers"}`,
            ].join(" · ")}
          </p>
        </div>
        <Button
          size="sm"
          variant={data.following ? "secondary" : "default"}
          onClick={toggleFollow}
          disabled={busy}
          aria-pressed={data.following}
          className="shrink-0 sm:mt-1"
        >
          {data.following ? "Following" : "Follow"}
        </Button>
      </header>

      {isEmpty && (
        <EmptyState
          title={`Nothing in #${tag} yet`}
          description="Papers, researchers, and posts on this topic will show up here."
          secondaryAction={
            <Button
              variant="outline"
              render={
                <Link href={`/discover/papers?tag=${encodeURIComponent(tag)}`} />
              }
            >
              Browse papers
            </Button>
          }
        />
      )}

      {data.papers.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionHeading
            title="Papers"
            action={
              <Button
                variant="ghost"
                size="sm"
                render={
                  <Link
                    href={`/discover/papers?tag=${encodeURIComponent(tag)}`}
                  />
                }
              >
                See all
              </Button>
            }
          />
          <div className="flex flex-col gap-2.5">
            {data.papers.map((p) => (
              <PaperRow key={p._id} paper={p} />
            ))}
          </div>
        </section>
      )}

      {data.people.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionHeading title="Researchers" />
          <div className="flex flex-col gap-2.5">
            {data.people.map((p) => (
              <PersonRow
                key={p._id}
                person={{
                  _id: p._id,
                  username: p.username,
                  displayName: p.displayName,
                  headline: p.headline,
                  avatarUrl: p.avatarUrl,
                  affiliation: "",
                  interests: [],
                }}
                showInterests={false}
              />
            ))}
          </div>
        </section>
      )}

      {data.posts.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionHeading title="Posts" />
          <ul className="flex flex-col gap-2.5">
            {data.posts.map((p) => (
              <li key={p._id}>
                <Link
                  href={`/?post=${encodeURIComponent(p._id)}`}
                  className="bg-card hover:bg-accent/50 border-border flex items-start gap-2.5 rounded-lg border p-4 text-sm leading-relaxed transition-colors"
                >
                  {p.author && (
                    <ProfileAvatar
                      src={p.author.avatarUrl}
                      alt={p.author.displayName}
                      initials={initialsOf(p.author.displayName)}
                      className="mt-0.5 size-6"
                      fallbackClassName="text-[10px]"
                    />
                  )}
                  <span className="min-w-0">
                    {p.author && (
                      <span className="text-muted-foreground mb-0.5 block text-xs font-medium">
                        {p.author.displayName}
                      </span>
                    )}
                    <span className="line-clamp-3">{p.body}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </PageShell>
  );
}
