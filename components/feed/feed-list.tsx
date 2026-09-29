"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState, PostSkeleton } from "@/components/common/states";
import { FeedItem, type FeedPost } from "@/components/feed/feed-item";

const PAGE_SIZE = 10;

/** Infinite ranked feed with skeletons + end-of-feed + retry. Remount (via key) for a fresh load. */
export function FeedList() {
  const router = useRouter();
  const [items, setItems] = useState<FeedPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [ended, setEnded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const seenIds = useRef<Set<string>>(new Set());

  const fetchPage = useCallback(
    async (cur: string | null, append: boolean) => {
      if (append) setLoadingMore(true);
      else {
        setLoading(true);
        seenIds.current = new Set();
      }
      setError(null);
      try {
        const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
        if (cur) params.set("cursor", cur);
        const res = await fetch(`/api/feed?${params}`);
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.error?.message ?? "Feed failed to load.");
        const fresh = (json.data.items as FeedPost[]).filter((p) => {
          if (seenIds.current.has(p._id)) return false;
          seenIds.current.add(p._id);
          return true;
        });
        setItems((prev) => (append ? [...prev, ...fresh] : fresh));
        setCursor(json.data.nextCursor);
        if (!json.data.nextCursor) setEnded(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Feed failed to load.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    // The `await` on the first tick keeps fetchPage's setState calls out of
    // the synchronous effect body (react-hooks/set-state-in-effect) while
    // still routing the first load through one code path.
    const loadOnce = async () => {
      await Promise.resolve();
      await fetchPage(null, false);
    };
    void loadOnce();
  }, [fetchPage]);

  useEffect(() => {
    if (ended || loading) return;
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchPage(cursor, true);
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ended, loading, loadingMore, cursor, fetchPage]);

  if (loading) {
    return <PostSkeleton />;
  }

  if (error && items.length === 0) {
    return (
      <EmptyState
        title="Feed failed to load"
        description={error}
        actionLabel="Retry"
        onAction={() => fetchPage(null, false)}
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your feed is quiet"
        description="Connect with researchers to fill your home feed — or be the first to post."
        actionLabel="Find researchers"
        onAction={() => router.push("/discover")}
      />
    );
  }

  return (
    <>
      {items.map((p) => (
        <FeedItem key={p._id} post={p} onChanged={() => fetchPage(null, false)} />
      ))}
      {!ended && <div ref={sentinel} aria-hidden />}
      {loadingMore && <PostSkeleton count={2} />}
      {ended && (
        <p className="text-muted-foreground py-4 text-center text-xs">
          You&apos;re all caught up.
        </p>
      )}
      {error && (
        <Button variant="outline" onClick={() => fetchPage(cursor, true)}>
          Retry ({error})
        </Button>
      )}
    </>
  );
}
