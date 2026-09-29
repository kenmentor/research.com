"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { UserSearch } from "lucide-react";
import { PageShell } from "@/components/common/page-shell";
import { PageHeader } from "@/components/common/page-header";
import { SubNav } from "@/components/common/sub-nav";
import {
  FilterBar,
  FilterField,
  ResultsMeta,
  SearchField,
} from "@/components/common/filter-bar";
import { PersonRow, type PersonRowData } from "@/components/common/person-row";
import { ListPagination } from "@/components/common/list-pagination";
import { EmptyState, ResultSkeleton } from "@/components/common/states";

const PAGE_SIZE = 20;

/**
 * Researcher discovery.
 *
 * Rebuilt on the shared primitives: the query field is now visually
 * distinct from the filters, each filter is labelled, the fetched
 * `interests` are actually rendered, the People/Papers switcher is real
 * navigation, and pagination uses the `Pagination` primitive that was
 * sitting unused in the UI kit.
 */
export function PeopleExplorer() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [institution, setInstitution] = useState(sp.get("institution") ?? "");
  const [field, setField] = useState(sp.get("field") ?? "");
  const [items, setItems] = useState<PersonRowData[]>([]);
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
          ...(q.trim() ? { q: q.trim() } : {}),
          ...(institution.trim() ? { institution: institution.trim() } : {}),
          ...(field.trim() ? { field: field.trim() } : {}),
        });
        router.replace(`/discover/people?${params}`, { scroll: false });
        const res = await fetch(`/api/discover/people?${params}`);
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
    // Filter states drive refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, institution, field, page]);

  const activeCount = [q, institution, field].filter((v) => v.trim()).length;
  const clearAll = () => {
    setQ("");
    setInstitution("");
    setField("");
    setPage(1);
  };

  const hrefFor = (p: number) => {
    const params = new URLSearchParams({ page: String(p) });
    if (q.trim()) params.set("q", q.trim());
    if (institution.trim()) params.set("institution", institution.trim());
    if (field.trim()) params.set("field", field.trim());
    return `/discover/people?${params}`;
  };

  return (
    <PageShell gap="md">
      <PageHeader
        eyebrow="Discover"
        title="Researchers"
        description="Find people by name, headline, or research interest. Narrow by institution or field."
      />

      <SubNav
        items={[
          { href: "/discover/people", label: "Researchers" },
          { href: "/discover/papers", label: "Papers" },
        ]}
      />

      <FilterBar onClearAll={clearAll} activeCount={activeCount}>
        <SearchField
          label="Search researchers"
          value={q}
          onChange={(v) => {
            setQ(v);
            setPage(1);
          }}
          placeholder="Name, headline, interest…"
        />
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <FilterField
            label="Institution"
            value={institution}
            onChange={(v) => {
              setInstitution(v);
              setPage(1);
            }}
            placeholder="Any institution"
          />
          <FilterField
            label="Field"
            value={field}
            onChange={(v) => {
              setField(v);
              setPage(1);
            }}
            placeholder="Any field"
          />
        </div>
      </FilterBar>

      <ResultsMeta count={total} noun="researcher" nounPlural="researchers" />

      {loading ? (
        <ResultSkeleton count={5} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={UserSearch}
          title="No researchers found"
          description={
            activeCount
              ? "Nothing matched those filters. Try broadening the search or clearing them."
              : "There are no researchers in the network yet."
          }
          {...(activeCount
            ? { actionLabel: "Clear filters", onAction: clearAll }
            : {})}
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((p) => (
            <PersonRow key={p._id} person={p} />
          ))}
        </div>
      )}

      <ListPagination
        page={page}
        pages={pages}
        onChange={setPage}
        hrefFor={hrefFor}
      />
    </PageShell>
  );
}
