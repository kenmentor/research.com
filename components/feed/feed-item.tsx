"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { ProfileAvatar } from "@/components/common/profile-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FeedCard } from "@/components/feed/feed-card";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { Textarea } from "@/components/ui/textarea";
import { initialsOf } from "@/lib/profile";

/** Strips the scheme and any trailing slash so a shared link reads clean. */
function prettyUrl(raw: string): string {
  return raw.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export interface FeedAuthor {
  username: string;
  displayName: string;
  headline: string;
  avatarUrl?: string;
}

export interface FeedPost {
  _id: string;
  author: FeedAuthor;
  body: string;
  linkUrl?: string;
  imageUrl?: string;
  publicationId?: { _id: string; title: string; venue?: string; year?: number } | null;
  repostOf?: { _id: string; body: string } | null;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  liked: boolean;
  saved: boolean;
}

interface ThreadComment {
  _id: string;
  body: string;
  createdAt: string;
  author: { username: string; displayName: string; avatarUrl?: string };
}

export function timeAgo(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

export function FeedItem({ post, onChanged }: { post: FeedPost; onChanged: () => void }) {
  const [liked, setLiked] = useState(post.liked);
  const [saved, setSaved] = useState(post.saved);
  const [likes, setLikes] = useState(post.likesCount);
  const [reposts, setReposts] = useState(post.repostsCount);
  const [open, setOpen] = useState(false);
  const [repostOpen, setRepostOpen] = useState(false);
  const [comments, setComments] = useState<ThreadComment[]>([]);
  const [draft, setDraft] = useState("");
  const [quote, setQuote] = useState("");
  const [reposting, setReposting] = useState(false);

  async function toggle(path: string, method: string, apply: () => void, revert: () => void, done?: string) {
    apply();
    try {
      const res = await fetch(path, { method });
      if (!res.ok) throw new Error();
      if (done) toast.success(done);
      onChanged();
    } catch {
      revert();
      toast.error("Action failed — try again.");
    }
  }

  function like() {
    if (liked) toggle(`/api/posts/${post._id}/like`, "DELETE", () => { setLiked(false); setLikes((n) => n - 1); }, () => { setLiked(true); setLikes((n) => n + 1); });
    else toggle(`/api/posts/${post._id}/like`, "POST", () => { setLiked(true); setLikes((n) => n + 1); }, () => { setLiked(false); setLikes((n) => n - 1); });
  }

  function save() {
    if (saved) toggle(`/api/posts/${post._id}/save`, "DELETE", () => setSaved(false), () => setSaved(true));
    else toggle(`/api/posts/${post._id}/save`, "POST", () => setSaved(true), () => setSaved(false), "Saved.");
  }

  async function loadComments() {
    const res = await fetch(`/api/posts/${post._id}/comments?limit=20`);
    const json = await res.json().catch(() => null);
    if (res.ok) setComments(json.data.items);
  }

  function toggleComments() {
    if (!open) loadComments();
    setOpen((o) => !o);
  }

  async function sendComment() {
    if (draft.trim().length === 0) return;
    const res = await fetch(`/api/posts/${post._id}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body: draft }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(json?.error?.message ?? "Could not comment.");
      return;
    }
    setDraft("");
    loadComments();
    onChanged();
  }

  async function sendRepost() {
    setReposting(true);
    try {
      const res = await fetch(`/api/posts/${post._id}/repost`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ quote }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message ?? "Could not repost.");
      setQuote("");
      setReposts((n) => n + 1);
      toast.success("Reposted.");
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not repost.");
    } finally {
      setReposting(false);
    }
  }

  return (
    <article id={`post-${post._id}`} className="contents">
    <FeedCard
      authorName={post.author.displayName}
      authorHeadline={post.author.headline}
      authorInitials={initialsOf(post.author.displayName)}
      authorUsername={post.author.username}
      authorAvatarUrl={post.author.avatarUrl}
      timeAgo={timeAgo(post.createdAt)}
      body={post.body}
      paperTitle={post.publicationId?.title}
      paperVenue={post.publicationId?.venue}
      paperYear={post.publicationId?.year}
      paperHref={post.publicationId?._id ? `/pub/${post.publicationId._id}` : undefined}
      likes={likes}
      comments={post.commentsCount}
      reposts={reposts}
      liked={liked}
      saved={saved}
      commentsOpen={open}
      onLike={like}
      onSave={save}
      onToggleComments={toggleComments}
      onRepost={() => setRepostOpen(true)}
    >
      {post.imageUrl && (
        <a
          href={post.imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-muted mx-4 mb-2 block overflow-hidden rounded-lg border"
        >
          {/* Remote post media — plain <img> avoids adding a next/image host allowlist. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imageUrl}
            alt="Attached to this post"
            loading="lazy"
            className="max-h-[26rem] w-full object-cover"
          />
        </a>
      )}
      {post.linkUrl && (
        <div className="px-4 pb-2 pt-1">
          <Link
            href={post.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary inline-flex max-w-full items-center gap-1 text-sm hover:underline"
          >
            <span className="truncate">{prettyUrl(post.linkUrl)}</span>
            <ArrowUpRight className="size-3.5 shrink-0" aria-hidden />
            <span className="sr-only">(opens in a new tab)</span>
          </Link>
        </div>
      )}
      {post.repostOf && (
        <div className="border-border bg-muted mx-4 mb-2 rounded border p-3 text-sm">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Reposted</p>
          <p className="mt-1 line-clamp-3">{post.repostOf.body || "(original post)"}</p>
        </div>
      )}
      {open && (
        <div className="border-border flex flex-col gap-3 border-t px-4 py-3">
          {comments.length === 0 && (
            <p className="text-muted-foreground text-sm">No comments yet.</p>
          )}
          {comments.map((c) => (
            <div key={c._id} className="flex gap-2.5 text-sm">
              <Link href={`/in/${c.author.username}`} className="shrink-0" tabIndex={-1} aria-hidden>
                <ProfileAvatar
                  src={c.author.avatarUrl}
                  alt={c.author.displayName}
                  initials={initialsOf(c.author.displayName)}
                  className="size-7"
                  fallbackClassName="text-[10px]"
                />
              </Link>
              <div className="bg-muted min-w-0 flex-1 rounded-lg px-3 py-2">
                <p className="text-xs font-semibold">{c.author.displayName}</p>
                <p className="break-words whitespace-pre-line">{c.body}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              placeholder="Write a comment…"
              aria-label="Write a comment"
              value={draft}
              maxLength={1000}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendComment();
              }}
            />
            <Button size="sm" onClick={sendComment} disabled={draft.trim().length === 0}>
              Send
            </Button>
          </div>
        </div>
      )}
      <ResponsiveDialog
        trigger={<span className="hidden" aria-hidden />}
        title="Repost"
        open={repostOpen}
        onOpenChange={setRepostOpen}
      >
        <div className="flex flex-col gap-3">
          <Textarea rows={3} maxLength={5000} placeholder="Add your take (optional)…" value={quote} onChange={(e) => setQuote(e.target.value)} />
          <Button
            onClick={async () => {
              await sendRepost();
              setRepostOpen(false);
            }}
            disabled={reposting}
          >
            {reposting ? "Reposting…" : "Repost"}
          </Button>
        </div>
      </ResponsiveDialog>
    </FeedCard>
    </article>
  );
}
