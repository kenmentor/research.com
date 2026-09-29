import { connectedIds, blockedIds } from "./network";
import { PostModel } from "@/models/post";

/**
 * V1 ranking: chronological recency plus a deterministic boost for
 * 1st-degree connections. Blocked authors are excluded before scoring.
 * Ordering is stable: ties break on _id.
 */
export const CONNECTION_BOOST_MS = 48 * 60 * 60 * 1000;
const POOL_LIMIT = 500;

export interface RankedPost {
  id: string;
  score: number;
}

export async function rankFeedPool(viewerId: string | null): Promise<RankedPost[]> {
  const [mine, blocked] = viewerId
    ? await Promise.all([connectedIds(viewerId), blockedIds(viewerId)])
    : [[], []];
  const circle = new Set([...mine, ...(viewerId ? [viewerId] : [])]);
  const hidden = new Set(blocked);

  const pool = await PostModel.find({
    ...(hidden.size ? { author: { $nin: [...hidden] } } : {}),
  })
    .select("_id author createdAt")
    .sort({ createdAt: -1 })
    .limit(POOL_LIMIT)
    .lean();

  return pool
    .map((p) => ({
      id: String(p._id),
      score:
        new Date(p.createdAt).getTime() +
        (circle.has(String(p.author)) ? CONNECTION_BOOST_MS : 0),
    }))
    .sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : 1));
}

export function encodeCursor(item: RankedPost): string {
  return Buffer.from(JSON.stringify(item)).toString("base64url");
}

export function decodeCursor(cursor: string): RankedPost | null {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString());
    if (typeof parsed?.id === "string" && typeof parsed?.score === "number") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
