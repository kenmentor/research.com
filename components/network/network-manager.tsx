"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, ErrorState, ResultSkeleton } from "@/components/common/states";
import { NetworkRow } from "@/components/network/network-row";

interface Entry {
  id: string;
  username: string;
  displayName: string;
  headline: string;
  avatarUrl?: string;
  mutuals: number;
}

interface BlockedEntry {
  _id: string;
  username: string;
  displayName: string;
  headline: string;
  avatarUrl?: string;
}

function initials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export function NetworkManager() {
  const router = useRouter();
  const [invitations, setInvitations] = useState<Entry[]>([]);
  const [outgoing, setOutgoing] = useState<Entry[]>([]);
  const [connections, setConnections] = useState<Entry[]>([]);
  const [suggestions, setSuggestions] = useState<Entry[]>([]);
  const [blocked, setBlocked] = useState<BlockedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [netRes, blRes] = await Promise.all([
          fetch("/api/network"),
          fetch("/api/blocks"),
        ]);
        if (cancelled) return;
        const [net, bl] = await Promise.all([
          netRes.json().catch(() => null),
          blRes.json().catch(() => null),
        ]);
        if (!netRes.ok || !net?.data) {
          throw new Error(net?.error?.message ?? "Network request failed.");
        }
        setInvitations(net.data.invitations);
        setOutgoing(net.data.outgoing);
        setConnections(net.data.connections);
        setSuggestions(net.data.suggestions);
        if (blRes.ok && bl?.data) setBlocked(bl.data.items);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load your network.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  async function act(path: string, method: string, body: unknown, done: string) {
    // Previously unhandled: a failed accept/decline threw straight out of the
    // onClick promise, so the user saw nothing and the row never changed.
    setBusy(true);
    try {
      const res = await fetch(path, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message ?? "Request failed.");
      toast.success(done);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  /** Opens (or reuses) the 1:1 thread with this person, then navigates to it. */
  async function openThread(otherId: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ otherId }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message ?? "Could not open the thread.");
      router.push(`/messages?c=${json.data.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open the thread.");
    } finally {
      setBusy(false);
    }
  }

  function row(e: Entry) {
    return {
      name: e.displayName,
      username: e.username,
      headline: e.headline,
      initials: initials(e.displayName),
      avatarUrl: e.avatarUrl,
      mutuals: e.mutuals,
      busy,
    };
  }

  if (loading) {
    return <ResultSkeleton count={4} />;
  }

  if (error) {
    return (
      <ErrorState
        title="Couldn't load your network"
        description={error}
        onRetry={() => {
          setError(null);
          setLoading(true);
          setRefreshKey((k) => k + 1);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Four triggers don't fit a 320px viewport, so the list scrolls
          rather than shrinking the labels to unreadable slivers. */}
      <Tabs defaultValue="invitations">
        <TabsList className="h-auto w-full justify-start overflow-x-auto">
          <TabsTrigger value="invitations" className="shrink-0">
            Invitations
            {invitations.length > 0 && (
              <span className="bg-primary text-primary-foreground ml-1.5 rounded-full px-1.5 py-0.5 text-[0.65rem] font-semibold tabular-nums">
                {invitations.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="connections" className="shrink-0">
            Connections
            {connections.length > 0 && (
              <span className="text-muted-foreground ml-1.5 text-xs font-medium tabular-nums">
                {connections.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="shrink-0">
            Suggestions
          </TabsTrigger>
          <TabsTrigger value="blocked" className="shrink-0">
            Blocked
            {blocked.length > 0 && (
              <span className="text-muted-foreground ml-1.5 text-xs font-medium tabular-nums">
                {blocked.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

      <TabsContent value="invitations" className="flex flex-col gap-3">
        {invitations.length === 0 && outgoing.length === 0 ? (
          <EmptyState
            title="No pending invitations"
            description="When researchers invite you to connect, they'll appear here."
            secondaryAction={
              <Button variant="outline" render={<Link href="/discover/people" />}>
                Find researchers
              </Button>
            }
          />
        ) : (
          <>
            {invitations.length > 0 && outgoing.length > 0 && (
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Received
              </p>
            )}
            {invitations.map((e) => (
              <NetworkRow
                key={e.id}
                {...row(e)}
                variant="invite"
                onPrimary={() =>
                  act(
                    "/api/connections",
                    "PATCH",
                    { otherId: e.id, action: "accept" },
                    `Connected with ${e.displayName}.`,
                  )
                }
                onSecondary={() =>
                  act(
                    "/api/connections",
                    "PATCH",
                    { otherId: e.id, action: "decline" },
                    "Invitation declined.",
                  )
                }
              />
            ))}
            {outgoing.length > 0 && (
              <p className="text-muted-foreground mt-1 text-xs font-medium tracking-wide uppercase">
                Sent
              </p>
            )}
            {outgoing.map((e) => (
              <NetworkRow
                key={e.id}
                {...row(e)}
                variant="pending"
                onPrimary={() =>
                  act(
                    "/api/connections",
                    "DELETE",
                    { otherId: e.id },
                    "Request withdrawn.",
                  )
                }
              />
            ))}
          </>
        )}
      </TabsContent>

      <TabsContent value="connections" className="flex flex-col gap-3">
        {connections.length === 0 ? (
          <EmptyState
            title="No connections yet"
            description="Accept an invitation or invite researchers whose work interests you."
            secondaryAction={
              <Button variant="outline" render={<Link href="/discover/people" />}>
                Find researchers
              </Button>
            }
          />
        ) : (
          connections.map((e) => (
            <NetworkRow
              key={e.id}
              {...row(e)}
              variant="connection"
              onPrimary={() => openThread(e.id)}
              onRemove={() =>
                act(
                  "/api/connections",
                  "DELETE",
                  { otherId: e.id },
                  `Removed ${e.displayName}.`,
                )
              }
            />
          ))
        )}
      </TabsContent>

      <TabsContent value="suggestions" className="flex flex-col gap-3">
        {suggestions.length === 0 ? (
          <EmptyState title="No suggestions right now" description="Complete your profile and connect — suggestions improve as your network grows." />
        ) : (
          suggestions.map((e) => (
            <NetworkRow
              key={e.id}
              {...row(e)}
              variant="suggestion"
              onPrimary={() => act("/api/connections", "POST", { recipientId: e.id }, `Request sent to ${e.displayName}.`)}
            />
          ))
        )}
      </TabsContent>

      <TabsContent value="blocked" className="flex flex-col gap-3">
        {blocked.length === 0 ? (
          <EmptyState
            title="Nobody blocked"
            description="Blocked researchers lose access to your profile and content."
          />
        ) : (
          blocked.map((b) => (
            <Card key={b._id}>
              <CardContent className="flex items-center gap-3">
                <Link href={`/in/${b.username}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{b.displayName}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {b.headline}
                  </p>
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    act(
                      "/api/blocks",
                      "DELETE",
                      { blockedId: b._id },
                      `Unblocked ${b.displayName}.`,
                    )
                  }
                >
                  Unblock
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </TabsContent>
      </Tabs>
    </div>
  );
}
