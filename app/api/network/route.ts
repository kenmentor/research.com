import { auth } from "@/auth";
import { handleApiError, notFound, ok, withApi } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { mutualCount, suggestionsFor } from "@/lib/network";
import { ConnectionModel } from "@/models/connection";
import { ProfileModel } from "@/models/profile";

const SNIPPET = "username displayName headline affiliation avatarUrl";

/**
 * My Network aggregate: invitations, outgoing requests, connections
 * (each with mutuals), and ranked suggestions.
 */
export const GET = withApi(async () => {
  const session = await auth();
  if (!session?.user) return handleApiError(notFound("Not signed in"));

  await connectDB();
  const me = await ProfileModel.findOne({ userId: session.user.id })
    .select("_id")
    .lean();
  if (!me) return handleApiError(notFound("Complete onboarding first."));
  const mine = String(me._id);

  const [incoming, outgoing, accepted] = await Promise.all([
    ConnectionModel.find({ recipient: mine, status: "pending" })
      .populate("requester", SNIPPET)
      .lean(),
    ConnectionModel.find({ requester: mine, status: "pending" })
      .populate("recipient", SNIPPET)
      .lean(),
    ConnectionModel.find({
      status: "accepted",
      $or: [{ requester: mine }, { recipient: mine }],
    })
      .populate("requester", SNIPPET)
      .populate("recipient", SNIPPET)
      .lean(),
  ]);

  async function withMutuals(ids: string[]) {
    return Promise.all(
      ids.map(async (id) => ({ id, mutuals: await mutualCount(mine, id) })),
    );
  }

  const incomingIds = incoming.map((e) => String((e.requester as unknown as { _id: unknown })._id));
  const outgoingIds = outgoing.map((e) => String((e.recipient as unknown as { _id: unknown })._id));
  const connectedIds = accepted.map((e) =>
    String((e.requester as unknown as { _id: unknown })._id) === mine
      ? String((e.recipient as unknown as { _id: unknown })._id)
      : String((e.requester as unknown as { _id: unknown })._id),
  );
  const [incomingM, outgoingM, connectedM] = await Promise.all([
    withMutuals(incomingIds),
    withMutuals(outgoingIds),
    withMutuals(connectedIds),
  ]);
  const mutualById = new Map(
    [...incomingM, ...outgoingM, ...connectedM].map((m) => [m.id, m.mutuals]),
  );

  const pick = (doc: unknown) => {
    const p = doc as {
      _id: unknown;
      username: string;
      displayName: string;
      headline: string;
      affiliation: string;
      avatarUrl: string;
    };
    return {
      id: String(p._id),
      username: p.username,
      displayName: p.displayName,
      headline: p.headline,
      affiliation: p.affiliation,
      avatarUrl: p.avatarUrl,
      mutuals: mutualById.get(String(p._id)) ?? 0,
    };
  };

  return ok({
    invitations: incoming.map((e) => pick(e.requester)),
    outgoing: outgoing.map((e) => pick(e.recipient)),
    connections: accepted.map((e) => {
      const other =
        String((e.requester as unknown as { _id: unknown })._id) === mine
          ? e.recipient
          : e.requester;
      return pick(other);
    }),
    suggestions: await suggestionsFor(mine),
  });
});
