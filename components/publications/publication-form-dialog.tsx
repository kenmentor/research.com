"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ZodError } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import {
  publicationCreateSchema,
  type PublicationCreateInput,
} from "@/lib/validators/publication";

export interface PublicationDraft {
  id?: string;
  title: string;
  authors: string;
  venue: string;
  year: string;
  doi: string;
  abstract: string;
  tags: string;
  fileUrl: string;
  featured: boolean;
}

export function toDraft(item?: {
  _id?: string;
  id?: string;
  title?: string;
  authors?: Array<{ name: string }>;
  venue?: string;
  year?: number;
  doi?: string;
  abstract?: string;
  tags?: string[];
  fileUrl?: string;
  featured?: boolean;
}): PublicationDraft {
  return {
    id: item?.id ?? item?._id,
    title: item?.title ?? "",
    authors: (item?.authors ?? []).map((a) => a.name).join("\n"),
    venue: item?.venue ?? "",
    year: item?.year != null ? String(item.year) : "",
    doi: item?.doi ?? "",
    abstract: item?.abstract ?? "",
    tags: (item?.tags ?? []).join(", "),
    fileUrl: item?.fileUrl ?? "",
    featured: item?.featured ?? false,
  };
}

export function PublicationFormDialog({
  trigger,
  title,
  initial,
  onSaved,
}: {
  trigger: React.ReactElement;
  title: string;
  initial?: PublicationDraft;
  onSaved: () => void;
}) {
  const router = useRouter();
  const form = useForm<PublicationDraft>({
    defaultValues: initial ?? toDraft(),
  });

  async function submit(draft: PublicationDraft) {
    const payload: PublicationCreateInput = publicationCreateSchema.parse({
      title: draft.title,
      authors: draft.authors
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((name) => ({ name })),
      venue: draft.venue,
      year: draft.year.trim() === "" ? undefined : Number(draft.year),
      doi: draft.doi,
      abstract: draft.abstract,
      tags: draft.tags.split(","),
      fileUrl: draft.fileUrl,
      featured: draft.featured,
    });

    const url = draft.id ? `/api/publications/${draft.id}` : "/api/publications";
    const res = await fetch(url, {
      method: draft.id ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.error?.message ?? "Could not save.");
    toast.success(draft.id ? "Publication updated." : "Publication added.");
    onSaved();
    router.refresh();
  }

  return (
    <ResponsiveDialog trigger={trigger} title={title}>
      <Form {...form}>
        <form
          className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto"
          onSubmit={form.handleSubmit(async (v) => {
            try {
              await submit(v);
            } catch (e) {
              if (e instanceof ZodError) {
                // Map schema paths back onto draft fields for inline errors.
                for (const issue of e.issues) {
                  const top = String(issue.path[0] ?? "");
                  const field =
                    top === "title" || top === "authors" || top === "venue" ||
                    top === "year" || top === "doi" || top === "abstract" ||
                    top === "tags" || top === "fileUrl"
                      ? top
                      : "title";
                  form.setError(field, { message: issue.message });
                }
                toast.error(e.issues[0]?.message ?? "Check the highlighted fields.");
              } else {
                toast.error(e instanceof Error ? e.message : "Could not save.");
              }
            }
          })}
        >
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="authors" render={({ field }) => (
            <FormItem><FormLabel>Authors (one per line)</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="venue" render={({ field }) => (
              <FormItem><FormLabel>Venue</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="year" render={({ field }) => (
              <FormItem><FormLabel>Year</FormLabel><FormControl><Input inputMode="numeric" placeholder="2024" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="doi" render={({ field }) => (
              <FormItem><FormLabel>DOI</FormLabel><FormControl><Input placeholder="10.xxxx/xxxxx" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="tags" render={({ field }) => (
              <FormItem><FormLabel>Tags (comma separated)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
          <FormField control={form.control} name="abstract" render={({ field }) => (
            <FormItem><FormLabel>Abstract</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="fileUrl" render={({ field }) => (
            <FormItem><FormLabel>PDF URL (external link only — direct uploads land in Phase 11)</FormLabel><FormControl><Input placeholder="https://…" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="featured" render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl><Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} /></FormControl>
              <FormLabel>Pin as featured (unpins others)</FormLabel>
            </FormItem>
          )} />
          <Button type="submit">Save publication</Button>
        </form>
      </Form>
    </ResponsiveDialog>
  );
}
