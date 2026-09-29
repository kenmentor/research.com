"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const PREF_GROUPS = [
  {
    title: "People",
    items: [
      { type: "connect_request", label: "Connection requests", hint: "Someone asks to connect." },
      { type: "connect_accept", label: "Connections accepted", hint: "A request you sent is accepted." },
      { type: "message", label: "Messages", hint: "Direct messages and requests." },
    ],
  },
  {
    title: "Your work",
    items: [
      { type: "cite", label: "Citations", hint: "One of your papers is cited." },
      { type: "mention", label: "Mentions", hint: "Someone mentions you in a post." },
    ],
  },
  {
    title: "Digest",
    items: [
      { type: "digest", label: "Weekly digest", hint: "A summary of activity across your fields." },
    ],
  },
] as const;

type Prefs = Record<string, boolean>;

/**
 * Notification preferences.
 *
 * `GET`/`PATCH /api/notifications/prefs` and `lib/notify.ts` have always
 * honoured these, but nothing in the UI could reach them — the flags were
 * only ever settable by hand in the database. Each switch saves
 * immediately so a dismissed dialog never silently discards choices.
 */
export function NotificationPrefs({ initial }: { initial: Prefs }) {
  const [prefs, setPrefs] = useState<Prefs>(() => {
    // Absent key means enabled, matching the API.
    const all: Prefs = {};
    for (const g of PREF_GROUPS) for (const i of g.items) all[i.type] = true;
    return { ...all, ...initial };
  });
  const [saving, setSaving] = useState<string | null>(null);

  async function toggle(type: string, next: boolean) {
    const prev = prefs;
    setPrefs((p) => ({ ...p, [type]: next }));
    setSaving(type);
    try {
      const res = await fetch("/api/notifications/prefs", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prefs: { [type]: next } }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message ?? "Could not save.");
      setPrefs((p) => ({ ...p, ...json.data.prefs }));
    } catch (e) {
      setPrefs(prev);
      toast.error(e instanceof Error ? e.message : "Could not save that preference.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Notifications</CardTitle>
        <CardDescription>
          Choose what you&apos;re told about. Changes save as you go.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {PREF_GROUPS.map((group) => (
          <fieldset key={group.title} className="flex flex-col gap-3">
            <legend className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {group.title}
            </legend>
            <ul className="flex flex-col divide-y">
              {group.items.map((item) => {
                const id = `pref-${item.type}`;
                const on = prefs[item.type] !== false;
                return (
                  <li key={item.type} className="flex items-center gap-4 py-2.5 first:pt-0">
                    <div className="min-w-0 flex-1">
                      <Label htmlFor={id} className="cursor-pointer text-sm font-medium">
                        {item.label}
                      </Label>
                      <p className="text-muted-foreground text-sm">{item.hint}</p>
                    </div>
                    <Switch
                      id={id}
                      checked={on}
                      disabled={saving === item.type}
                      onCheckedChange={(v) => toggle(item.type, v)}
                    />
                  </li>
                );
              })}
            </ul>
          </fieldset>
        ))}
      </CardContent>
    </Card>
  );
}
