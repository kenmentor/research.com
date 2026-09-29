import { Suspense } from "react";
import { PapersExplorer } from "@/components/search/papers-explorer";
import { ResultSkeleton } from "@/components/common/states";

export const metadata = {
  title: "Discover papers",
  description:
    "Search publications by title, abstract, topic, and venue. Sort by relevance, recency, or citation count.",
};

export default function DiscoverPapersPage() {
  return (
    <Suspense fallback={<ResultSkeleton variant="card" count={4} />}>
      <PapersExplorer />
    </Suspense>
  );
}
