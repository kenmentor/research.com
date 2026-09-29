"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function DownloadButton({ pubId, hasFile }: { pubId: string; hasFile: boolean }) {
  const [busy, setBusy] = useState(false);

  async function download() {
    if (!hasFile || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/publications/${pubId}`, { method: "POST" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.data?.fileUrl) throw new Error("No file attached.");
      window.open(json.data.fileUrl, "_blank", "noopener");
      toast.success("Download counted.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not download.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button onClick={download} disabled={!hasFile || busy}>
      {hasFile ? "Download PDF" : "No PDF attached"}
    </Button>
  );
}
