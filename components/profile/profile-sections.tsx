"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import {
  educationSchema,
  experienceSchema,
  grantSchema,
  type ProfilePatchInput,
} from "@/lib/validators/profile";
import type {
  EducationEntry,
  ExperienceEntry,
  GrantEntry,
  ProfileSection,
  ProfileVisibility,
} from "@/models/profile";

export interface SerializedProfile {
  username: string;
  displayName: string;
  headline: string;
  affiliation: string;
  location: string;
  bio: string;
  interests: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  grants: GrantEntry[];
  sectionVisibility: Record<ProfileSection, ProfileVisibility>;
  visible: Record<ProfileSection, boolean>;
}

async function saveProfile(patch: ProfilePatchInput): Promise<void> {
  const res = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error?.message ?? "Could not save.");
}

function VisibilitySelect({
  value,
  onChange,
}: {
  value: ProfileVisibility;
  onChange: (v: ProfileVisibility) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ProfileVisibility)}>
      <SelectTrigger className="w-40" aria-label="Section visibility">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="public">Public</SelectItem>
        <SelectItem value="connections">Connections only</SelectItem>
      </SelectContent>
    </Select>
  );
}

function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="text-muted-foreground text-sm">{text}</p>;
}

/* ------------------------------- About ---------------------------------- */

const aboutSchema = z.object({
  headline: z.string().trim().min(4).max(160),
  affiliation: z.string().trim().min(2).max(160),
  location: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(2000).optional(),
  visibility: z.enum(["public", "connections"]),
});

function EditAbout({ profile }: { profile: SerializedProfile }) {
  const router = useRouter();
  const form = useForm<z.infer<typeof aboutSchema>>({
    resolver: zodResolver(aboutSchema),
    defaultValues: {
      headline: profile.headline,
      affiliation: profile.affiliation,
      location: profile.location,
      bio: profile.bio,
      visibility: profile.sectionVisibility.about,
    },
  });

  return (
    <ResponsiveDialog
      trigger={<Button variant="ghost" size="sm">Edit</Button>}
      title="Edit about"
    >
      <Form {...form}>
        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit(async (v) => {
            try {
              await saveProfile({
                headline: v.headline,
                affiliation: v.affiliation,
                location: v.location,
                bio: v.bio,
                sectionVisibility: { about: v.visibility },
              });
              toast.success("About saved.");
              router.refresh();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Could not save.");
            }
          })}
        >
          <FormField control={form.control} name="headline" render={({ field }) => (
            <FormItem><FormLabel>Headline</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="affiliation" render={({ field }) => (
            <FormItem><FormLabel>Institution</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="location" render={({ field }) => (
            <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="bio" render={({ field }) => (
            <FormItem><FormLabel>Bio</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="visibility" render={({ field }) => (
            <FormItem><FormLabel>Who can see this section</FormLabel><VisibilitySelect value={field.value} onChange={field.onChange} /></FormItem>
          )} />
          <Button type="submit">Save</Button>
        </form>
      </Form>
    </ResponsiveDialog>
  );
}

/* ----------------------------- Interests -------------------------------- */

const PRESETS = ["Theology", "Public Health", "Computer Science", "Agriculture", "Education", "Economics", "History", "Linguistics"];

function EditInterests({ profile }: { profile: SerializedProfile }) {
  const router = useRouter();
  const form = useForm<{ interests: string[]; visibility: ProfileVisibility }>({
    defaultValues: { interests: profile.interests, visibility: profile.sectionVisibility.interests },
  });
  const interests = form.watch("interests");
  const hasTopic = (t: string) => interests.includes(t.toLowerCase());
  function toggleTopic(t: string) {
    const key = t.toLowerCase();
    form.setValue("interests", hasTopic(t) ? interests.filter((x) => x !== key) : [...interests, key]);
  }

  return (
    <ResponsiveDialog
      trigger={<Button variant="ghost" size="sm">Edit</Button>}
      title="Edit interests"
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(async (v) => {
          try {
            await saveProfile({ interests: v.interests, sectionVisibility: { interests: v.visibility } });
            toast.success("Interests saved.");
            router.refresh();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not save.");
          }
        })}
      >
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((t) => {
            const active = hasTopic(t);
            return (
              <Badge
                key={t}
                variant={active ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleTopic(t)}
              >
                {t}
              </Badge>
            );
          })}
        </div>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Who can see this section
          <VisibilitySelect value={form.watch("visibility")} onChange={(v) => form.setValue("visibility", v)} />
        </label>
        <Button type="submit">Save</Button>
      </form>
    </ResponsiveDialog>
  );
}

/* ------------------------- Experience/Education -------------------------- */

function EntriesEditor<T extends object>({
  title,
  items,
  fields,
  onSave,
}: {
  title: string;
  items: T[];
  fields: Array<{ name: string; label: string; placeholder?: string; type?: string }>;
  onSave: (items: T[]) => Promise<void>;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<T[]>(items);
  const [busy, setBusy] = useState(false);

  function setCell(i: number, name: string, value: string) {
    setRows((prev) => prev.map((row, j) => (j === i ? { ...row, [name]: value } : row)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await onSave(rows);
      toast.success(`${title} saved.`);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof z.ZodError
          ? (err.issues[0]?.message ?? "Check the highlighted fields.")
          : err instanceof Error
            ? err.message
            : "Could not save.";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ResponsiveDialog trigger={<Button variant="ghost" size="sm">Edit</Button>} title={title}>
      <form
        className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto"
        onSubmit={submit}
      >
        {rows.map((row, i) => (
          <div key={i} className="border-border flex flex-col gap-2 rounded border p-3">
            {fields.map((f) => (
              <label key={f.name} className="flex flex-col gap-1 text-xs font-medium">
                {f.label}
                <Input
                  type={f.type ?? "text"}
                  placeholder={f.placeholder}
                  value={String((row as Record<string, unknown>)[f.name] ?? "")}
                  onChange={(e) => setCell(i, f.name, e.target.value)}
                />
              </label>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="self-end"
              onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setRows((prev) => [
              ...prev,
              Object.fromEntries(fields.map((f) => [f.name, ""])) as T,
            ])
          }
        >
          Add entry
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </Button>
      </form>
    </ResponsiveDialog>
  );
}

/* -------------------------------- Page ----------------------------------- */

export function ProfileSections({ profile, isOwner }: { profile: SerializedProfile; isOwner: boolean }) {
  const exp = [...profile.experience].sort((a, b) => b.start.localeCompare(a.start));
  const edu = [...profile.education].sort((a, b) => (b.endYear ?? b.startYear ?? 0) - (a.endYear ?? a.startYear ?? 0));
  const grants = [...profile.grants].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));

  return (
    <div className="flex flex-col gap-4">
      {profile.visible.about && (
        <SectionCard title="About" action={isOwner && <EditAbout profile={profile} />}>
          {profile.bio ? (
            <p className="text-sm whitespace-pre-line">{profile.bio}</p>
          ) : (
            <EmptyHint text={isOwner ? "Tell visitors what you research — edit this section to add a bio." : "No bio yet."} />
          )}
        </SectionCard>
      )}

      {profile.visible.interests && (
        <SectionCard title="Research interests" action={isOwner && <EditInterests profile={profile} />}>
          {profile.interests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((t) => (
                <Badge key={t} variant="secondary">{t}</Badge>
              ))}
            </div>
          ) : (
            <EmptyHint text={isOwner ? "Add topics so others can discover your work." : "No interests listed."} />
          )}
        </SectionCard>
      )}

      {profile.visible.experience && (
        <SectionCard
          title="Experience"
          action={isOwner && (
            <EntriesEditor<ExperienceEntry>
              title="Edit experience"
              items={profile.experience}
              fields={[
                { name: "title", label: "Title", placeholder: "Senior Lecturer" },
                { name: "organization", label: "Organization", placeholder: "University of Lagos" },
                { name: "start", label: "Start", placeholder: "2020" },
                { name: "end", label: "End (blank if current)", placeholder: "2024" },
                { name: "description", label: "Description" },
              ]}
              onSave={async (items) => {
                const parsed = z.array(experienceSchema).parse(items);
                await saveProfile({ experience: parsed });
              }}
            />
          )}
        >
          {exp.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {exp.map((e, i) => (
                <li key={i} className="text-sm">
                  <p className="font-semibold">{e.title} · {e.organization}</p>
                  <p className="text-muted-foreground text-xs">{e.start} – {e.current ? "Present" : e.end || "—"}</p>
                  {e.description && <p className="mt-1">{e.description}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyHint text={isOwner ? "Add roles to show your trajectory." : "No experience listed."} />
          )}
        </SectionCard>
      )}

      {profile.visible.education && (
        <SectionCard
          title="Education"
          action={isOwner && (
            <EntriesEditor<EducationEntry>
              title="Edit education"
              items={profile.education}
              fields={[
                { name: "school", label: "School", placeholder: "University of Ibadan" },
                { name: "degree", label: "Degree", placeholder: "PhD" },
                { name: "field", label: "Field of study", placeholder: "Public Health" },
                { name: "startYear", label: "Start year", type: "number" },
                { name: "endYear", label: "End year", type: "number" },
              ]}
              onSave={async (items) => {
                const parsed = z.array(educationSchema).parse(items.map((x) => ({
                  ...x,
                  startYear: x.startYear ? Number(x.startYear) : undefined,
                  endYear: x.endYear ? Number(x.endYear) : undefined,
                })));
                await saveProfile({ education: parsed });
              }}
            />
          )}
        >
          {edu.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {edu.map((e, i) => (
                <li key={i} className="text-sm">
                  <p className="font-semibold">{e.school}</p>
                  <p className="text-muted-foreground text-xs">{e.degree}{e.field ? `, ${e.field}` : ""}{e.startYear || e.endYear ? ` · ${e.startYear ?? ""}–${e.endYear ?? ""}` : ""}</p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyHint text={isOwner ? "Add your education history." : "No education listed."} />
          )}
        </SectionCard>
      )}

      {profile.visible.grants && (
        <SectionCard
          title="Grants & awards"
          action={isOwner && (
            <EntriesEditor<GrantEntry>
              title="Edit grants & awards"
              items={profile.grants}
              fields={[
                { name: "title", label: "Title", placeholder: "Early-career fellowship" },
                { name: "funder", label: "Funder", placeholder: "Wellcome" },
                { name: "year", label: "Year", type: "number" },
                { name: "amount", label: "Amount (optional)" },
              ]}
              onSave={async (items) => {
                const parsed = z.array(grantSchema).parse(items.map((x) => ({
                  ...x,
                  year: x.year ? Number(x.year) : undefined,
                })));
                await saveProfile({ grants: parsed });
              }}
            />
          )}
        >
          {grants.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {grants.map((g, i) => (
                <li key={i} className="text-sm">
                  <p className="font-semibold">{g.title}</p>
                  <p className="text-muted-foreground text-xs">{g.funder}{g.year ? ` · ${g.year}` : ""}{g.amount ? ` · ${g.amount}` : ""}</p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyHint text={isOwner ? "Showcase funding and recognition." : "No grants listed."} />
          )}
        </SectionCard>
      )}
    </div>
  );
}
