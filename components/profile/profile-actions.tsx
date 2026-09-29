"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ProfileHeader,
  type ConnectionState,
} from "@/components/profile/profile-header";

export function ProfileActions({
  profileId,
  displayName,
  headline,
  affiliation,
  location,
  initials,
  avatarUrl,
  interests,
  verified,
  mutuals,
  isOwner,
  initialConnection,
  initialFollowing,
  initialBlocked,
}: {
  profileId: string;
  displayName: string;
  headline: string;
  affiliation: string;
  location: string;
  initials: string;
  avatarUrl?: string;
  interests: string[];
  verified: boolean;
  mutuals: number;
  isOwner: boolean;
  initialConnection: ConnectionState;
  initialFollowing: boolean;
  initialBlocked: boolean;
}) {
  const router = useRouter();
  const [connection, setConnection] = useState<ConnectionState>(initialConnection);
  const [following, setFollowing] = useState(initialFollowing);
  const [blocked, setBlocked] = useState(initialBlocked);
  const [busy, setBusy] = useState(false);

  async function call(path: string, method: string, body: unknown) {
    const res = await fetch(path, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.error?.message ?? "Request failed.");
    return json?.data;
  }

  async function onConnect() {
    if (isOwner || busy) return;
    setBusy(true);
    try {
      if (connection === "none") {
        const data = await call("/api/connections", "POST", { recipientId: profileId });
        setConnection(data.status === "accepted" ? "connected" : "pending-sent");
        toast.success("Connection request sent.");
      } else if (connection === "pending-sent") {
        await call("/api/connections", "DELETE", { recipientId: profileId });
        setConnection("none");
        toast.success("Request withdrawn.");
      } else if (connection === "pending-received") {
        await onAccept();
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not connect.");
    } finally {
      setBusy(false);
    }
  }

  /**
   * Incoming requests are accepted here rather than sending the user off
   * to My Network — PATCH /api/connections has always supported
   * accept/decline, the old path just never called it.
   */
  async function onAccept() {
    if (isOwner || busy) return;
    setBusy(true);
    try {
      await call("/api/connections", "PATCH", {
        otherId: profileId,
        action: "accept",
      });
      setConnection("connected");
      toast.success(`You and ${displayName} are now connected.`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not accept request.");
      setBusy(false);
    }
  }

  async function onDecline() {
    if (isOwner || busy) return;
    setBusy(true);
    try {
      await call("/api/connections", "PATCH", {
        otherId: profileId,
        action: "decline",
      });
      setConnection("none");
      toast.success("Request declined.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not decline request.");
      setBusy(false);
    }
  }

  async function onFollow() {
    if (isOwner || busy) return;
    setBusy(true);
    try {
      if (following) {
        await call("/api/follows", "DELETE", { followingId: profileId });
        setFollowing(false);
      } else {
        await call("/api/follows", "POST", { followingId: profileId });
        setFollowing(true);
        toast.success(`Following ${displayName}.`);
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not follow.");
    } finally {
      setBusy(false);
    }
  }

  async function onMessage() {
    if (isOwner || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ otherId: profileId }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message ?? "Could not open chat.");
      router.push(`/messages?c=${json.data.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open chat.");
    } finally {
      setBusy(false);
    }
  }

  async function onBlock() {
    if (isOwner || busy) return;
    setBusy(true);
    try {
      if (blocked) {
        await call("/api/blocks", "DELETE", { blockedId: profileId });
        setBlocked(false);
        toast.success(`Unblocked ${displayName}.`);
      } else {
        await call("/api/blocks", "POST", { blockedId: profileId });
        setBlocked(true);
        setConnection("none");
        setFollowing(false);
        toast.success(`Blocked ${displayName}.`);
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update block.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ProfileHeader
      displayName={displayName}
      headline={headline}
      affiliation={affiliation}
      location={location}
      initials={initials}
      avatarUrl={avatarUrl}
      interests={interests}
      verified={verified}
      connectionState={isOwner ? "connected" : connection}
      following={following}
      blocked={blocked}
      mutuals={mutuals}
      busy={busy}
      onConnect={isOwner ? undefined : onConnect}
      onAccept={isOwner ? undefined : onAccept}
      onDecline={isOwner ? undefined : onDecline}
      onMessage={isOwner ? undefined : onMessage}
      onFollow={isOwner ? undefined : onFollow}
      onBlock={isOwner ? undefined : onBlock}
    />
  );
}
