"use client";

import { useState } from "react";
import { Composer } from "@/components/feed/composer";
import { FeedList } from "@/components/feed/feed-list";

/** Home feed: composer refreshes the list on post. */
export function HomeFeed({
  displayName,
  avatarUrl,
  ownerId,
}: {
  displayName: string;
  avatarUrl?: string;
  ownerId: string;
}) {
  const [feedKey, setFeedKey] = useState(0);

  return (
    <div className="flex flex-col gap-4">
      <Composer
        displayName={displayName}
        avatarUrl={avatarUrl}
        ownerId={ownerId}
        onPosted={() => setFeedKey((k) => k + 1)}
      />
      <FeedList key={feedKey} />
    </div>
  );
}
