"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

const ROWS = [
  ["connect_request", "Connection requests", "Someone wants to connect"],
  ["connect_accept", "Accepted requests", "Your request was accepted"],
  ["message", "Messages", "New chat messages"],
  ["cite", "Citations", "Your paper was cited"],
  ["mention", "Mentions", "Someone mentions you"],
  ["digest", "Email digest", "Unread summary email"],
] as const;

/** Per-type notification preferences (in-app + email gates). */
export function NotificationPrefs() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/notifications/prefs")
      .then((r) => r.json())
      .then((j) => {
        if (j?.data?.prefs) setPrefs(j.data.prefs);
      })
      .catch(() => {});
  }, []);

  async function toggle(type: string, enabled: boolean) {
    setPrefs((p) => ({ ...p, [type]: enabled }));
    try {
      const res = await fetch("/api/notifications/prefs", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prefs: { [type]: enabled } }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setPrefs((p) => ({ ...p, [type]: !enabled }));
      toast.error("Could not save preference.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Notifications</CardTitle>
        <CardDescription>Gate in-app and email delivery per type.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {ROWS.map(([type, label, hint]) => (
          <label key={type} className="flex items-center justify-between gap-4 text-sm">
            <span>
              <span className="block font-medium">{label}</span>
              <span className="text-muted-foreground block text-xs">{hint}</span>
            </span>
            <Switch
              checked={prefs[type] !== false}
              onCheckedChange={(v) => toggle(type, v)}
              aria-label={label}
            />
          </label>
        ))}
      </CardContent>
    </Card>
  );
}
