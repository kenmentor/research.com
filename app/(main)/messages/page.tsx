import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MessagesClient } from "@/components/messages/messages-client";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/messages");
  const { c } = await searchParams;

  return <MessagesClient initialId={c ?? null} />;
}
