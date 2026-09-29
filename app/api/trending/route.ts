import { connectDB } from "@/lib/db";
import { ok, withApi } from "@/lib/api";
import { trendingTags } from "@/lib/search";

/** Trending topics for the palette empty state. Public. */
export const GET = withApi(async () => {
  await connectDB();
  return ok({ topics: await trendingTags(10) });
});
