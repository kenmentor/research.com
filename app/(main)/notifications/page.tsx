import { PageHeader } from "@/components/common/page-header";
import { PageShell } from "@/components/common/page-shell";
import { NotificationsList } from "@/components/notifications/notifications-list";

export const metadata = {
  title: "Notifications",
  description: "Connection requests, mentions, and activity on your work.",
};

export default function NotificationsPage() {
  return (
    <PageShell gap="lg">
      <PageHeader
        eyebrow="Activity"
        title="Notifications"
        description="Connection requests, mentions, and activity on your work."
      />
      <NotificationsList />
    </PageShell>
  );
}
