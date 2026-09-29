"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { FileSearch } from "lucide-react";
import { PageShell } from "@/components/common/page-shell";
import { PageHeader } from "@/components/common/page-header";
import { SubNav } from "@/components/common/sub-nav";
import {
  FilterBar,
  FilterField,
  ResultsMeta,
  SearchField,
} from "@/components/common/filter-bar";
import { PaperRow, type PaperRowData } from "@/components/common/paper-row";
import { ListPagination } from "@/components/common/list-pagination";
import { EmptyState, ResultSkeleton } from "@/components/common/states";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE = 20;

const SORTS = [
  { value: "relevance", label: "Most relevant" },
  { value: "newest", label: "Newest first" },
  { value: "cited", label: "Most cited" },
];

/** Publication discovery, rebuilt on the shared primitives. */
export function PapersExplorer() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [tag, setTag] = useState(sp.get("tag") ?? "");
  const [venue, setVenue] = useState(sp.get("venue") ?? "");
  const [sort, setSort] = useState(sp.get("sort") ?? "relevance");
  const [items, setItems] = useState<PaperRowData[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          page: String(page),
          sort,
          ...(q.trim() ? { q: q.trim() } : {}),
          ...(tag.trim() ? { tag: tag.trim() } : {}),
          ...(venue.trim() ? { venue: venue.trim() } : {}),
        });
        router.replace(`/discover/papers?${params}`, { scroll: false });
        const res = await fetch(`/api/discover/papers?${params}`);
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(json?.error?.message ?? "Search failed.");
        setItems(json.data.items);
        setTotal(json.data.total);
        setPages(json.data.pages);
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : "Search failed.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, tag, venue, sort, page]);

  const activeCount = [q, tag, venue].filter((v) => v.trim()).length;
  const clearAll = () => {
    setQ("");
    setTag("");
    setVenue("");
    setPage(1);
  };

  const hrefFor = (p: number) => {
    const params = new URLSearchParams({ page: String(p), sort });
    if (q.trim()) params.set("q", q.trim());
    if (tag.trim()) params.set("tag", tag.trim());
    if (venue.trim()) params.set("venue", venue.trim());
    return `/discover/papers?${params}`;
  };

  return (
    <PageShell gap="md">
      <PageHeader
        eyebrow="Discover"
        title="Papers"
        description="Search across titles and abstracts. Filter by topic or venue, and sort by relevance, recency, or citation count."
      />

      <SubNav
        items={[
          { href: "/discover/people", label: "Researchers" },
          { href: "/discover/papers", label: "Papers" },
        ]}
      />

      <FilterBar onClearAll={clearAll} activeCount={activeCount}>
        <SearchField
          label="Search papers"
          value={q}
          onChange={(v) => {
            setQ(v);
            setPage(1);
          }}
          placeholder="Title, abstract, author…"
        />
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <FilterField
            label="Topic"
            value={tag}
            onChange={(v) => {
              setTag(v);
              setPage(1);
            }}
            placeholder="Any topic"
          />
          <FilterField
            label="Venue"
            value={venue}
            onChange={(v) => {
              setVenue(v);
              setPage(1);
            }}
            placeholder="Any venue"
          />
        </div>
        <div className="sm:w-44">
          <label
            htmlFor="sort-papers"
            className="text-muted-foreground mb-1 block text-xs font-medium"
          >
            Sort by
          </label>
          <Select
            value={sort}
            onValueChange={(v) => {
              setSort(typeof v === "string" ? v : "relevance");
              setPage(1);
            }}
          >
            <SelectTrigger id="sort-papers" className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </FilterBar>

      <ResultsMeta count={total} noun="paper" nounPlural="papers" />

      {loading ? (
        <ResultSkeleton variant="card" count={4} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={FileSearch}
          title="No papers found"
          description={
            activeCount
              ? "Nothing matched those filters. Try broadening the search or clearing them."
              : "No publications have been added yet."
          }
          {...(activeCount ? { actionLabel: "Clear filters", onAction: clearAll } : {})}
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((p) => (
            <PaperRow key={p._id} paper={p} showAbstract />
          ))}
        </div>
      )}

      <ListPagination page={page} pages={pages} onChange={setPage} hrefFor={hrefFor} />
    </PageShell>
  );
}
