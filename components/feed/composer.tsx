"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PenLine } from "lucide-react";
import { toast } from "sonner";
import { ProfileAvatar } from "@/components/common/profile-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveDialog } from "@/components/common/responsive-dialog";
import { initialsOf } from "@/lib/profile";

interface OwnPaper {
  _id: string;
  title: string;
}

/** Start-a-post trigger + adaptive composer. Draft clears on success. */
export function Composer({
  displayName,
  avatarUrl,
  ownerId,
  onPosted,
}: {
  displayName: string;
  avatarUrl?: string;
  ownerId: string;
  onPosted?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [paperId, setPaperId] = useState("");
  const [papers, setPapers] = useState<OwnPaper[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openComposer() {
    setOpen(true);
    try {
      const res = await fetch(`/api/publications?ownerId=${ownerId}&limit=50`);
      const json = await res.json();
      if (res.ok) setPapers(json.data.items);
    } catch {
      /* paper attach is optional */
    }
  }

  async function submit() {
    if (body.trim().length === 0) {
      setError("Write something first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          body,
          linkUrl,
          imageUrl,
          publicationId: paperId || undefined,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message ?? "Could not post.");
      setBody("");
      setLinkUrl("");
      setImageUrl("");
      setPaperId("");
      setOpen(false);
      toast.success("Posted.");
      onPosted?.();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not post.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Card>
        <CardContent className="flex items-center gap-3">
          <ProfileAvatar
            src={avatarUrl}
            alt={displayName}
            initials={initialsOf(displayName)}
            className="size-10 shrink-0"
            fallbackClassName="text-sm font-medium"
          />
          <button
            type="button"
            onClick={openComposer}
            className="text-muted-foreground hover:bg-accent hover:text-foreground flex-1 rounded-full border px-4 py-2 text-left text-sm transition-colors"
          >
            Start a post
          </button>
          <Button
            variant="ghost"
            size="icon"
            onClick={openComposer}
            aria-label="Open composer"
            className="text-primary hidden shrink-0 sm:inline-flex"
          >
            <PenLine className="size-5" />
          </Button>
        </CardContent>
      </Card>

      <ResponsiveDialog
        trigger={<Button className="hidden" aria-hidden tabIndex={-1}>Open composer</Button>}
        title="Create a post"
        description="Share research, a question, or an update with your network."
        open={open}
        onOpenChange={setOpen}
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="composer-body">Post</Label>
            <Textarea
              id="composer-body"
              rows={4}
              maxLength={5000}
              placeholder="What are you working on?"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <p className="text-muted-foreground text-xs tabular-nums">
              {body.length.toLocaleString()} / 5,000
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="composer-link">Link</Label>
            <Input
              id="composer-link"
              type="url"
              inputMode="url"
              placeholder="https://…"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="composer-image">Image URL</Label>
            <Input
              id="composer-image"
              type="url"
              inputMode="url"
              placeholder="https://… (png, jpg, webp)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>

          {papers.length > 0 && (
            <div className="space-y-1.5">
              <Label>Attach a paper</Label>
              <Select value={paperId} onValueChange={(v) => setPaperId(v ?? "")}>
                <SelectTrigger aria-label="Attach a paper">
                  <SelectValue placeholder="Choose one of your papers" />
                </SelectTrigger>
                <SelectContent>
                  {papers.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || body.trim().length === 0}>
              {busy ? "Posting…" : "Post"}
            </Button>
          </div>
        </form>
      </ResponsiveDialog>
    </>
  );
}
