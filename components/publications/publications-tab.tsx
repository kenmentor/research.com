"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/states";
import {
  PublicationFormDialog,
  toDraft,
} from "@/components/publications/publication-form-dialog";

interface PubItem {
  _id: string;
  title: string;
  authors: Array<{ name: string }>;
  venue: string;
  year?: number;
  tags: string[];
  featured: boolean;
  readsCount: number;
  downloadsCount: number;
  citationsCount: number;
}

export function PublicationsTab({ ownerId, isOwner }: { ownerId: string; isOwner: boolean }) {
  const [items, setItems] = useState<PubItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          ownerId,
          page: String(page),
          sort,
          ...(q.trim() ? { q: q.trim() } : {}),
        });
        const res = await fetch(`/api/publications?${params}`);
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(json?.error?.message ?? "Could not load.");
        setItems(json.data.items);
        setTotal(json.data.total);
        setPages(json.data.pages);
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : "Could not load.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ownerId, page, sort, q, refreshKey]);

  async function remove(id: string) {
    if (!window.confirm("Delete this publication?")) return;
    const res = await fetch(`/api/publications/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      toast.error(json?.error?.message ?? "Could not delete.");
      return;
    }
    toast.success("Publication deleted.");
    refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search this author's papers…"
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
          className="max-w-xs"
        />
        <Select
          value={sort}
          onValueChange={(v) => {
            setPage(1);
            setSort(typeof v === "string" ? v : "newest");
          }}
        >
          <SelectTrigger className="w-40" aria-label="Sort publications">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="cited">Most cited</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-muted-foreground ml-auto text-xs">
          {total} publication{total === 1 ? "" : "s"}
        </span>
        {isOwner && (
          <PublicationFormDialog
            trigger={<Button size="sm">Add publication</Button>}
            title="Add publication"
            onSaved={refresh}
          />
        )}
      </div>

      {loading ? (
        <>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </>
      ) : items.length === 0 ? (
        <EmptyState
          title="No publications found"
          description={
            isOwner
              ? "Add your first paper so others can discover your work."
              : "Try a different search."
          }
        />
      ) : (
        items.map((p) => (
          <Card key={p._id}>
            <CardContent className="flex flex-col gap-1 pt-4">
              <div className="flex items-start gap-2">
                <Link href={`/pub/${p._id}`} className="text-sm font-semibold hover:underline">
                  {p.title}
                </Link>
                {p.featured && <Badge>Featured</Badge>}
              </div>
              <p className="text-muted-foreground text-xs">
                {p.authors.map((a) => a.name).join(", ")}
              </p>
              <p className="text-muted-foreground text-xs">
                {[p.venue, p.year].filter(Boolean).join(" · ")}
              </p>
              <div className="mt-1 flex items-center gap-3 text-xs">
                <span>{p.citationsCount} cites</span>
                <span>{p.readsCount} reads</span>
                <span>{p.downloadsCount} downloads</span>
                {p.tags.slice(0, 3).map((t) => (
                  <Badge key={t} variant="outline">
                    {t}
                  </Badge>
                ))}
                {isOwner && (
                  <span className="ml-auto flex gap-1">
                    <PublicationFormDialog
                      trigger={<Button variant="ghost" size="sm">Edit</Button>}
                      title="Edit publication"
                      initial={toDraft(p)}
                      onSaved={refresh}
                    />
                    <Button variant="ghost" size="sm" onClick={() => remove(p._id)}>
                      Delete
                    </Button>
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span>
            Page {page} of {pages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
