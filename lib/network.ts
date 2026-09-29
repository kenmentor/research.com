import { BlockModel } from "@/models/block";
import { ConnectionModel } from "@/models/connection";
import { ProfileModel } from "@/models/profile";

/** IDs with an accepted connection to this profile (either side). */
export async function connectedIds(profileId: string): Promise<string[]> {
  const edges = await ConnectionModel.find({
    status: "accepted",
    $or: [{ requester: profileId }, { recipient: profileId }],
  })
    .select("requester recipient")
    .lean();
  return edges.map((e) =>
    String(e.requester) === profileId ? String(e.recipient) : String(e.requester),
  );
}

/** Mutual-connection count between two profiles (graph intersection). */
export async function mutualCount(a: string, b: string): Promise<number> {
  const [aIds, bIds] = await Promise.all([connectedIds(a), connectedIds(b)]);
  const set = new Set(aIds);
  return bIds.filter((id) => set.has(id)).length;
}

/** IDs this profile blocked + IDs that blocked this profile. */
export async function blockedIds(profileId: string): Promise<string[]> {
  const [outgoing, incoming] = await Promise.all([
    BlockModel.find({ blocker: profileId }).select("blocked").lean(),
    BlockModel.find({ blocked: profileId }).select("blocker").lean(),
  ]);
  return [
    ...outgoing.map((b) => String(b.blocked)),
    ...incoming.map((b) => String(b.blocker)),
  ];
}

/** True when either side blocked the other — hide everything both ways. */
export async function isBlockedEitherWay(a: string, b: string): Promise<boolean> {
  const hit = await BlockModel.exists({
    $or: [
      { blocker: a, blocked: b },
      { blocker: b, blocked: a },
    ],
  });
  return Boolean(hit);
}

export interface Suggestion {
  _id: string;
  username: string;
  displayName: string;
  headline: string;
  affiliation: string;
  avatarUrl: string;
  mutuals: number;
  sharedInterests: number;
}

/**
 * Suggested collaborators: same affiliation or shared interests,
 * excluding self, connections, pendings, and blocks — ranked by
 * mutuals then shared interests.
 */
export async function suggestionsFor(
  profileId: string,
  limit = 10,
): Promise<Suggestion[]> {
  const me = await ProfileModel.findById(profileId)
    .select("affiliation interests")
    .lean();
  if (!me) return [];

  const [mine, excluded] = await Promise.all([
    connectedIds(profileId),
    blockedIds(profileId),
  ]);
  const skip = new Set([profileId, ...mine, ...excluded]);

  const pending = await ConnectionModel.find({
    status: "pending",
    $or: [{ requester: profileId }, { recipient: profileId }],
  })
    .select("requester recipient")
    .lean();
  for (const e of pending) {
    skip.add(String(e.requester) === profileId ? String(e.recipient) : String(e.requester));
  }

  const candidates = await ProfileModel.find({
    _id: { $nin: [...skip] },
    $or: [{ affiliation: me.affiliation }, { interests: { $in: me.interests } }],
  })
    .select("username displayName headline affiliation interests avatarUrl")
    .limit(50)
    .lean();

  const mineSet = new Set(mine);
  const myInterests = new Set(me.interests);
  const ranked = await Promise.all(
    candidates.map(async (c) => {
      const cId = String(c._id);
      const cConns = await connectedIds(cId);
      return {
        _id: cId,
        username: c.username,
        displayName: c.displayName,
        headline: c.headline,
        affiliation: c.affiliation,
        avatarUrl: c.avatarUrl,
        mutuals: cConns.filter((id) => mineSet.has(id)).length,
        sharedInterests: c.interests.filter((t) => myInterests.has(t)).length,
      };
    }),
  );
  return ranked
    .sort((a, b) => b.mutuals - a.mutuals || b.sharedInterests - a.sharedInterests)
    .slice(0, limit);
}
