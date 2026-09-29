"use client";

import { useEffect, useRef } from "react";

export interface ThreadMessage {
  _id: string;
  sender: string;
  body: string;
  state: string;
  createdAt: string;
}

interface ThreadHandlers {
  onMessage: (m: ThreadMessage) => void;
  onRead: () => void;
  onSync: (items: ThreadMessage[]) => void;
  onTyping?: () => void;
}

/**
 * Thread realtime: Pusher socket when keys are configured, otherwise
 * 5s polling of the same endpoint. Presence heartbeat runs in both.
 */
export function useThread(conversationId: string | null, handlers: ThreadHandlers) {
  const ref = useRef(handlers);
  useEffect(() => {
    ref.current = handlers;
  });

  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    // Presence heartbeat (30s) in both modes.
    const beat = () => fetch("/api/presence", { method: "POST" }).catch(() => {});
    beat();
    const heartbeat = setInterval(beat, 30_000);

    async function socketMode() {
      const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
      const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
      if (!key || !cluster) return false;
      const { default: Pusher } = await import("pusher-js");
      const pusher = new Pusher(key, {
        cluster,
        channelAuthorization: { endpoint: "/api/pusher/auth", transport: "ajax" },
      });
      const channel = pusher.subscribe(`private-conv-${conversationId}`);
      channel.bind("message:new", (m: ThreadMessage) => {
        if (!cancelled) ref.current.onMessage(m);
      });
      channel.bind("message:read", () => {
        if (!cancelled) ref.current.onRead();
      });
      channel.bind("client-typing", () => {
        if (!cancelled) ref.current.onTyping?.();
      });
      cleanup = () => {
        pusher.unsubscribe(`private-conv-${conversationId}`);
        pusher.disconnect();
      };
      return true;
    }

    async function pollingMode() {
      const tick = async () => {
        try {
          const res = await fetch(
            `/api/conversations/${conversationId}/messages?limit=50&open=1`,
          );
          const json = await res.json().catch(() => null);
          if (!cancelled && res.ok) ref.current.onSync(json.data.items);
        } catch {
          /* retry next tick */
        }
      };
      await tick();
      const timer = setInterval(tick, 5000);
      cleanup = () => clearInterval(timer);
    }

    socketMode().then((live) => {
      if (!cancelled && !live) void pollingMode();
    });

    return () => {
      cancelled = true;
      clearInterval(heartbeat);
      cleanup?.();
    };
  }, [conversationId]);
}

/** Throttled typing broadcast (socket mode only; no-op when polling). */
export function useTyping(conversationId: string | null) {
  const channelRef = useRef<{ trigger: (event: string, data?: unknown) => void } | null>(null);

  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;
    (async () => {
      const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
      const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
      if (!key || !cluster) return;
      const { default: Pusher } = await import("pusher-js");
      const pusher = new Pusher(key, {
        cluster,
        channelAuthorization: { endpoint: "/api/pusher/auth", transport: "ajax" },
      });
      const channel = pusher.subscribe(`private-conv-${conversationId}`);
      if (!cancelled) channelRef.current = channel as unknown as typeof channelRef.current;
    })();
    return () => {
      cancelled = true;
      channelRef.current = null;
    };
  }, [conversationId]);

  const last = useRef(0);
  return () => {
    const now = Date.now();
    if (now - last.current < 2000) return;
    last.current = now;
    try {
      channelRef.current?.trigger("client-typing", {});
    } catch {
      /* polling mode */
    }
  };
}
