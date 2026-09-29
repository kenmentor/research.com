import { PageHeader } from "@/components/common/page-header";
import { PageShell } from "@/components/common/page-shell";
import { NetworkManager } from "@/components/network/network-manager";

export const metadata = {
  title: "My Network",
  description: "Manage invitations, connections, suggestions, and blocked researchers.",
};

export default function NetworkPage() {
  return (
    <PageShell gap="lg">
      <PageHeader
        eyebrow="Network"
        title="My Network"
        description="Invitations, connections, and researchers you might want to know."
      />
      <NetworkManager />
    </PageShell>
  );
}
