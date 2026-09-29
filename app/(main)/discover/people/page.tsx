import { Suspense } from "react";
import { PeopleExplorer } from "@/components/search/people-explorer";
import { ResultSkeleton } from "@/components/common/states";

export const metadata = {
  title: "Discover researchers",
  description:
    "Search researchers across the network by name, institution, and research field.",
};

export default function DiscoverPeoplePage() {
  return (
    // The explorer reads search params on the client, so it needs a
    // boundary. Skeleton shaped like real rows, not a spinner.
    <Suspense fallback={<ResultSkeleton count={5} />}>
      <PeopleExplorer />
    </Suspense>
  );
}
