"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { ProfileAvatar } from "@/components/common/profile-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, ErrorState, ResultSkeleton } from "@/components/common/states";
import { MessageBubble } from "@/components/messages/message-bubble";
import { useThread, useTyping, type ThreadMessage } from "@/hooks/use-thread";
import { initialsOf } from "@/lib/profile";
import type { MessageState } from "@/models/message";

interface ThreadSummary {
  _id: string;
  status: string;
  other: {
    _id: string;
    username: string;
    displayName: string;
    headline: string;
    avatarUrl?: string;
    lastActiveAt?: string;
  } | null;
  lastMessage: { body: string; sender: string; createdAt: string } | null;
  lastMessageAt?: string;
  unread: number;
  mineRequested: boolean;
}

function isOnline(lastActiveAt?: string): boolean {
  if (!lastActiveAt) return false;
  return Date.now() - new Date(lastActiveAt).getTime() < 90_000;
}

function stamp(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function MessagesClient({ initialId }: { initialId: string | null }) {
  const [box, setBox] = useState<"inbox" | "requests">("inbox");
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [requests, setRequests] = useState<ThreadSummary[]>([]);
  const [selected, setSelected] = useState<string | null>(initialId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [inboxRes, reqsRes] = await Promise.all([
          fetch("/api/conversations?box=inbox"),
          fetch("/api/conversations?box=requests"),
        ]);
        if (cancelled) return;
        const [inbox, reqs] = await Promise.all([
          inboxRes.json().catch(() => null),
          reqsRes.json().catch(() => null),
        ]);
        if (!inboxRes.ok || !inbox?.data) {
          throw new Error(inbox?.error?.message ?? "Could not load conversations.");
        }
        setThreads(inbox.data.items);
        if (reqsRes.ok && reqs?.data) setRequests(reqs.data.items);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load conversations.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    const t = setInterval(refresh, 15_000);
    return () => clearInterval(t);
  }, [refresh]);

  const totalUnread = threads.reduce((n, t) => n + t.unread, 0);
  const list = box === "inbox" ? threads : requests;
  const active = [...threads, ...requests].find((t) => t._id === selected) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Messages
        </h1>
        {totalUnread > 0 && (
          <Badge variant="secondary">
            {totalUnread} unread
          </Badge>
        )}
      </div>

      {error ? (
        <ErrorState
          title="Couldn't load conversations"
          description={error}
          onRetry={() => {
            setError(null);
            setLoading(true);
            setRefreshKey((k) => k + 1);
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          {/* List — full screen on mobile unless a thread is open */}
          <div className={selected ? "hidden md:block" : "block"}>
            <Tabs value={box} onValueChange={(v) => setBox(v as "inbox" | "requests")}>
              <TabsList className="w-full">
                <TabsTrigger value="inbox" className="flex-1">
                  Inbox
                  {totalUnread > 0 && (
                    <span className="bg-primary text-primary-foreground ml-1.5 rounded-full px-1.5 py-0.5 text-[0.65rem] font-semibold tabular-nums">
                      {totalUnread}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="requests" className="flex-1">
                  Requests
                  {requests.length > 0 && (
                    <span className="text-muted-foreground ml-1.5 text-xs font-medium tabular-nums">
                      {requests.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="mt-3 flex flex-col gap-2">
              {loading ? (
                <ResultSkeleton count={5} />
              ) : list.length === 0 ? (
                <EmptyState
                  title={box === "inbox" ? "No conversations" : "No message requests"}
                  description={
                    box === "inbox"
                      ? "Connect with researchers to start chatting."
                      : "Messages from people you haven't connected with land here."
                  }
                  secondaryAction={
                    box === "inbox" ? (
                      <Button variant="outline" render={<Link href="/network" />}>
                        Open My Network
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                list.map((t) => (
                  <button
                    key={t._id}
                    onClick={() => setSelected(t._id)}
                    aria-current={selected === t._id}
                    className={`border-border bg-card hover:bg-accent/50 focus-visible:ring-primary flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none ${
                      selected === t._id ? "border-primary bg-accent/40" : ""
                    }`}
                  >
                    <span className="relative">
                      <ProfileAvatar
                        src={t.other?.avatarUrl}
                        alt={t.other?.displayName ?? "Conversation"}
                        initials={initialsOf(t.other?.displayName ?? "?")}
                        fallbackClassName="text-sm font-medium"
                      />
                      {isOnline(t.other?.lastActiveAt) && (
                        <span className="border-card absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 bg-success" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold">
                          {t.other?.displayName}
                        </span>
                        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                          {stamp(t.lastMessage?.createdAt ?? t.lastMessageAt)}
                        </span>
                      </span>
                      <span className="text-muted-foreground block truncate text-sm">
                        {t.lastMessage?.body ??
                          (box === "requests" ? "New message request" : "Say hello…")}
                      </span>
                    </span>
                    {t.unread > 0 && (
                      <Badge className="shrink-0 tabular-nums">{t.unread}</Badge>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Thread — full screen on mobile with back nav */}
          <div className={selected ? "block" : "hidden md:block"}>
            {active && active.other ? (
              <ThreadPane
                key={active._id}
                threadId={active._id}
                status={active.status}
                mineRequested={active.mineRequested}
                other={active.other}
                onBack={() => {
                  setSelected(null);
                  refresh();
                }}
                onChanged={refresh}
              />
            ) : (
              <Card className="text-muted-foreground hidden h-full min-h-72 items-center justify-center p-10 text-center text-sm md:flex">
                Select a conversation to start messaging.
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ThreadPane({
  threadId,
  status,
  mineRequested,
  other,
  onBack,
  onChanged,
}: {
  threadId: string;
  status: string;
  mineRequested: boolean;
  other: NonNullable<ThreadSummary["other"]>;
  onBack: () => void;
  onChanged: () => void;
}) {
  const [items, setItems] = useState<ThreadMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [ended, setEnded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notifyTyping = useTyping(threadId);

  const merge = useCallback((incoming: ThreadMessage[]) => {
    setItems((prev) => {
      const known = new Set(prev.map((m) => m._id));
      const fresh = incoming.filter((m) => !known.has(m._id));
      if (fresh.length === 0) {
        // Refresh states of known messages.
        const states = new Map(incoming.map((m) => [m._id, m.state]));
        let changed = false;
        const next = prev.map((m) => {
          const s = states.get(m._id);
          if (s && s !== m.state) {
            changed = true;
            return { ...m, state: s };
          }
          return m;
        });
        return changed ? next : prev;
      }
      return [...prev, ...fresh].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    });
  }, []);

  useThread(threadId, {
    onMessage: (m) => {
      merge([m]);
      scrollDown();
    },
    onRead: () => {
      setItems((prev) => prev.map((m) => ({ ...m, state: "read" })));
    },
    onSync: (synced) => merge(synced),
    onTyping: () => {
      setTyping(true);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(false), 3500);
    },
  });

  function scrollDown() {
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
  }

  useEffect(() => {
    scrollDown();
  }, [items.length]);

  async function send() {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    const res = await fetch(`/api/conversations/${threadId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(json?.error?.message ?? "Could not send.");
      setDraft(body);
      return;
    }
    merge([json.data]);
    scrollDown();
    onChanged();
  }

  async function loadOlder() {
    if (items.length === 0 || ended) return;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/conversations/${threadId}/messages?limit=50&open=1&before=${encodeURIComponent(items[0].createdAt)}`,
      );
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error();
      if (json.data.items.length === 0) setEnded(true);
      else {
        const known = new Set(items.map((m) => m._id));
        const older = (json.data.items as ThreadMessage[]).filter((m) => !known.has(m._id));
        setItems((prev) => [...older, ...prev]);
      }
    } catch {
      toast.error("Could not load older messages.");
    } finally {
      setLoadingMore(false);
    }
  }

  async function respond(action: "accept" | "decline" | "block") {
    const res = await fetch(`/api/conversations/${threadId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      toast.error(json?.error?.message ?? "Action failed.");
      return;
    }
    toast.success(
      action === "accept" ? "Request accepted — say hello." : action === "block" ? "Blocked." : "Request declined.",
    );
    onBack();
  }

  const canWrite = status === "active" || mineRequested;

  return (
    // dvh (not vh) so mobile browser chrome doesn't clip the composer.
    // A single fixed height per breakpoint also replaces the old
    // min-h/max-h pair, which fought itself on short viewports.
    <Card className="flex h-[calc(100dvh-15rem)] min-h-[26rem] flex-col overflow-hidden md:h-[calc(100dvh-13rem)]">
      <div className="border-border flex items-center gap-2 border-b p-3">
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          onClick={onBack}
          aria-label="Back to conversations"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <ProfileAvatar
          src={other.avatarUrl}
          alt={other.displayName}
          initials={initialsOf(other.displayName)}
          className="size-9"
          fallbackClassName="text-xs"
        />
        <div className="min-w-0 flex-1">
          <Link
            href={`/in/${other.username}`}
            className="hover:text-primary block truncate text-sm font-semibold transition-colors"
          >
            {other.displayName}
          </Link>
          <p className="text-muted-foreground truncate text-xs">
            {isOnline(other.lastActiveAt) ? (
              <span className="text-success font-medium">Online</span>
            ) : (
              other.headline
            )}
          </p>
        </div>
      </div>

      {status === "requested" && !mineRequested ? (
        <div className="flex flex-col items-center gap-2 p-6 text-center">
          <p className="text-sm font-medium">Message request</p>
          <p className="text-muted-foreground text-xs">
            {other.displayName} wants to chat. Accept to open the thread.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => respond("accept")}>Accept</Button>
            <Button size="sm" variant="outline" onClick={() => respond("decline")}>Decline</Button>
            <Button size="sm" variant="ghost" onClick={() => respond("block")}>Block</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
            {!ended && items.length > 0 && (
              <Button variant="ghost" size="sm" disabled={loadingMore} onClick={loadOlder}>
                {loadingMore ? "Loading…" : "Load older"}
              </Button>
            )}
            {items.length === 0 && (
              <p className="text-muted-foreground py-8 text-center text-sm">
                {mineRequested ? "Your request is in their inbox — say hello." : "No messages yet — say hello."}
              </p>
            )}
            {items.map((m) => (
              <MessageBubble
                key={m._id}
                body={m.body}
                time={stamp(m.createdAt)}
                own={m.sender !== other._id}
                state={(m.state as MessageState) ?? "sent"}
              />
            ))}
            {typing && <p className="text-muted-foreground text-xs italic">typing…</p>}
            <div ref={bottomRef} />
          </div>
          {canWrite ? (
            <form
              className="border-border flex gap-2 border-t p-3"
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
            >
              <Input
                aria-label={`Message ${other.displayName}`}
                placeholder="Write a message…"
                value={draft}
                maxLength={2000}
                onChange={(e) => {
                  setDraft(e.target.value);
                  notifyTyping();
                }}
              />
              <Button type="submit" disabled={draft.trim().length === 0}>
                Send
              </Button>
            </form>
          ) : (
            <p className="text-muted-foreground border-t p-3 text-center text-xs">
              Accept this request to reply.
            </p>
          )}
        </>
      )}
    </Card>
  );
}
