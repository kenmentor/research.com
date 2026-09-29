"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { signOut } from "next-auth/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { onboardingSchema, type OnboardingInput } from "@/lib/validators/onboarding";
import { cn } from "@/lib/utils";

const INTEREST_PRESETS = [
  "Theology",
  "Public Health",
  "Computer Science",
  "Agriculture",
  "Education",
  "Economics",
  "History",
  "Linguistics",
];

export function SettingsForm({
  defaults,
  email,
}: {
  defaults: OnboardingInput;
  email: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [customTag, setCustomTag] = useState("");
  const form = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: defaults,
  });

  const interests = useMemo(() => form.watch("interests") ?? [], [form]);

  /** Presets plus whatever the profile already has, so a custom interest
   *  saved earlier still renders as a removable chip. */
  const allTags = useMemo(
    () => [
      ...new Set([
        ...INTEREST_PRESETS,
        ...interests.map((t) => t.replace(/\b\w/g, (c) => c.toUpperCase())),
      ]),
    ],
    [interests],
  );

  function addCustom() {
    const key = customTag.trim().toLowerCase();
    if (!key || interests.includes(key)) {
      setCustomTag("");
      return;
    }
    form.setValue("interests", [...interests, key], {
      shouldDirty: true,
      shouldValidate: true,
    });
    setCustomTag("");
  }

  async function submit(values: OnboardingInput) {
    setSaving(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Could not save.");
      toast.success("Settings saved.");
      form.reset(values);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Account settings</CardTitle>
          <CardDescription>
            Signed in as <strong>{email}</strong>. Changes reflect immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(submit)} className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Handle</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="headline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Headline</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="affiliation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Institution</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="interests"
                render={() => (
                  <FormItem>
                    <FormLabel>Interests</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {/* Real buttons, not <Badge onClick> — the chips were
                          unreachable by keyboard and invisible to assistive
                          tech, despite looking interactive. */}
                      {allTags.map((tag) => {
                        const key = tag.toLowerCase();
                        const active = interests.includes(key);
                        return (
                          <button
                            key={key}
                            type="button"
                            role="switch"
                            aria-checked={active}
                            onClick={() =>
                              form.setValue(
                                "interests",
                                active
                                  ? interests.filter((t) => t !== key)
                                  : [...interests, key],
                                { shouldDirty: true, shouldValidate: true },
                              )
                            }
                            className={cn(
                              "rounded-md border px-2 py-0.5 text-sm font-medium transition-colors",
                              active
                                ? "border-primary bg-primary text-primary-foreground"
                                : "hover:bg-accent border-border",
                            )}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>

                    {/* Presets alone locked researchers out of their own
                        field — nothing outside the eight suggestions could
                        ever be added. */}
                    <div className="mt-3 flex gap-2">
                      <Input
                        value={customTag}
                        onChange={(e) => setCustomTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addCustom();
                          }
                        }}
                        placeholder="Add your own…"
                        aria-label="Add a research interest"
                        className="h-9"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addCustom}
                        disabled={customTag.trim().length === 0}
                      >
                        Add
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={!form.formState.isDirty || saving}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
                {form.formState.isDirty && (
                  <p className="text-muted-foreground text-xs">
                    Unsaved changes
                  </p>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Session</CardTitle>
          <CardDescription>
            Ends the session on this device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Was labelled "Sign out everywhere", but signOut() only clears
              the current session — the label promised something it didn't do. */}
          <Button variant="outline" onClick={() => signOut({ callbackUrl: "/login" })}>
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
