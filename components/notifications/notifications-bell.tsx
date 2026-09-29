"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Item {
  _id: string;
  type: string;
  actor: { username: string; displayName: string } | null;
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

function targetHref(item: Item): string {
  if (item.type === "message" && item.targetId) return `/messages?c=${item.targetId}`;
  if (item.type === "cite" && item.targetId) return `/pub/${item.targetId}`;
  if (item.actor) return `/in/${item.actor.username}`;
  return "/notifications";
}

/** Bell with grouped tabs + unread badge. */
export function NotificationsBell({
  initialUnreadCount = 0,
}: {
  initialUnreadCount?: number;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(initialUnreadCount);
  const [tab, setTab] = useState("all");

  const load = useCallback(async (filter = "all") => {
    try {
      const res = await fetch(`/api/notifications?filter=${filter}&limit=10`);
      const json = await res.json().catch(() => null);
      if (res.ok) {
        setItems(json.data.items);
        setUnread(json.data.unreadCount);
      }
    } catch {
      /* bell degrades silently */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/notifications?filter=all&limit=10");
      const json = await res.json().catch(() => null);
      if (cancelled || !res.ok) return;
      setItems(json.data.items);
      setUnread(json.data.unreadCount);
    })();
    const t = setInterval(() => {
      void load();
    }, 30_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [load]);

  async function markAll() {
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ all: true }),
    }).catch(() => {});
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    setUnread(0);
  }

  const shown = tab === "unread" ? items.filter((i) => !i.read) : items;

  return (
    <Popover>
      <PopoverTrigger
        aria-label="Notifications"
        render={
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="size-5" />
            {unread > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px]">
                {unread}
              </Badge>
            )}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-3 pb-0">
          <Tabs
            value={tab}
            onValueChange={(v) => {
              const next = typeof v === "string" ? v : "all";
              setTab(next);
              void load(next);
            }}
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread{unread > 0 ? ` (${unread})` : ""}</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="ghost" size="sm" onClick={markAll}>
            Mark all read
          </Button>
        </div>
        <div className="flex max-h-80 flex-col gap-1 overflow-y-auto p-3">
          {shown.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">You&apos;re all caught up.</p>
          ) : (
            shown.map((i) => (
              <Link
                key={i._id}
                href={targetHref(i)}
                className={`rounded-md p-2 text-sm hover:bg-muted ${i.read ? "" : "bg-muted/60 font-medium"}`}
              >
                {(LABELS[i.type] ?? (() => i.type))(i.actor?.displayName ?? "Someone")}
              </Link>
            ))
          )}
          <Link href="/notifications" className="text-primary pt-1 text-center text-xs hover:underline">
            View all
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
