import Pusher from "pusher";

/**
 * Realtime seam (spec: Pusher for V1, Mongo as source of truth).
 *
 * Every broadcast is persist-then-send: callers save to Mongo first,
 * then call broadcast(). Without Pusher keys configured this is a
 * no-op and clients fall back to 5s polling — chat works either way.
 */

let client: Pusher | null | undefined;

function getClient(): Pusher | null {
  if (client !== undefined) return client;
  const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } = process.env;
  if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) {
    client = null;
    return client;
  }
  client = new Pusher({
    appId: PUSHER_APP_ID,
    key: PUSHER_KEY,
    secret: PUSHER_SECRET,
    cluster: PUSHER_CLUSTER,
    useTLS: true,
  });
  return client;
}

export function realtimeEnabled(): boolean {
  return getClient() !== null;
}

/** 1-1 thread channel. Private: only the two participants join. */
export function threadChannel(conversationId: string): string {
  return `private-conv-${conversationId}`;
}

export async function broadcast(
  conversationId: string,
  event: "message:new" | "message:read" | "thread:update",
  data: Record<string, unknown>,
): Promise<void> {
  const pusher = getClient();
  if (!pusher) return;
  try {
    await pusher.trigger(threadChannel(conversationId), event, data);
  } catch (error) {
    console.error("[realtime] broadcast failed", error);
  }
}

/** Presence: `presence-researcher` channel; auth restricted to signed-in users. */
export function presenceChannel(): string {
  return "presence-researcher";
}
