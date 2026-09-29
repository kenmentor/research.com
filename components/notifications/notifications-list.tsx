"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, ErrorState, ResultSkeleton } from "@/components/common/states";
import { ProfileAvatar } from "@/components/common/profile-avatar";
import { ListPagination } from "@/components/common/list-pagination";
import { initialsOf } from "@/lib/profile";

interface Item {
  _id: string;
  type: string;
  actor: { username: string; displayName: string; avatarUrl?: string } | null;
  targetKind?: string | null;
  targetId?: string | null;
  read: boolean;
  createdAt: string;
}

const LABELS: Record<string, (a: string) => string> = {
  connect_request: (a) => `${a} sent you a connection request`,
  connect_accept: (a) => `${a} accepted your request`,
  message: (a) => `New message from ${a}`,
  cite: () => "Your paper was cited",
  mention: (a) => `${a} mentioned you`,
};

/** Short relative time — "3d" reads better than a full locale stamp. */
function ago(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString();
}

function targetHref(item: Item): string {
  if (item.type === "message" && item.targetId) return `/messages?c=${item.targetId}`;
  if (item.type === "cite" && item.targetId) return `/pub/${item.targetId}`;
  if (item.actor) return `/in/${item.actor.username}`;
  return "/notifications";
}

export function NotificationsList() {
  const [items, setItems] = useState<Item[]>([]);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/notifications?filter=${filter}&page=${page}&limit=20`);
        const json = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok) throw new Error(json?.error?.message ?? "Could not load.");
        setItems(json.data.items);
        setPages(json.data.pages);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load notifications.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filter, page, tick]);

  async function markAll() {
    try {
      const res = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.map((i) => ({ ...i, read: true })));
      toast.success("All marked read.");
    } catch {
      toast.error("Could not mark everything read.");
    }
  }

  const unread = items.filter((i) => !i.read).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs
          value={filter}
          onValueChange={(v) => {
            setFilter(typeof v === "string" ? v : "all");
            setPage(1);
          }}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          variant="outline"
          size="sm"
          onClick={markAll}
          disabled={unread === 0}
        >
          {unread > 0 ? `Mark all read (${unread})` : "All read"}
        </Button>
      </div>

      {error ? (
        <ErrorState
          title="Couldn't load notifications"
          description={error}
          onRetry={() => setTick((t) => t + 1)}
        />
      ) : loading ? (
        <ResultSkeleton count={6} />
      ) : items.length === 0 ? (
        <EmptyState
          title={filter === "unread" ? "Nothing unread" : "No notifications"}
          description="Activity on your work and network lands here."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((i) => (
            <li key={i._id}>
              <Card
                className={
                  i.read
                    ? ""
                    : "border-primary/40 bg-brand-soft/25 transition-colors"
                }
              >
                <CardContent className="pt-4">
                  <Link
                    href={targetHref(i)}
                    className="hover:bg-accent/40 -mx-2 flex items-center gap-3 rounded-lg px-2 py-1 transition-colors"
                  >
                    <ProfileAvatar
                      src={i.actor?.avatarUrl}
                      alt={i.actor?.displayName ?? "Someone"}
                      initials={initialsOf(i.actor?.displayName ?? "?")}
                      className="size-9"
                      fallbackClassName="text-xs font-medium"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm leading-snug">
                        {(LABELS[i.type] ?? ((a: string) => a))(
                          i.actor?.displayName ?? "Someone",
                        )}
                      </span>
                      <time
                        dateTime={i.createdAt}
                        className="text-muted-foreground block text-xs tabular-nums"
                      >
                        {ago(i.createdAt)}
                      </time>
                    </span>
                    {!i.read && (
                      <span
                        className="bg-primary size-2 shrink-0 rounded-full"
                        aria-label="Unread"
                      />
                    )}
                  </Link>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {!error && !loading && (
        <ListPagination
          page={page}
          pages={pages}
          onChange={setPage}
          hrefFor={(n) => `/notifications?filter=${filter}&page=${n}`}
        />
      )}
    </div>
  );
}
