import { TopicView } from "@/components/search/topic-view";

export default async function TopicPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  return <TopicView tag={decodeURIComponent(tag)} />;
}
