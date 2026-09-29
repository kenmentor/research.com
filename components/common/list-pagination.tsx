"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

/**
 * Windowed page numbers with ellipses (1 … 4 5 6 … 12).
 *
 * Renders real anchors so middle-click, keyboard traversal, and crawlers
 * still work, while the click handler keeps the current list mounted
 * instead of triggering a full navigation. Returns null for
 * single-page results so callers don't have to guard.
 */
export function ListPagination({
  page,
  pages,
  onChange,
  hrefFor,
  className,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
  /** Builds a real href for a page number, for progressive enhancement. */
  hrefFor: (page: number) => string;
  className?: string;
}) {
  if (pages <= 1) return null;

  const go = (next: number, e: React.MouseEvent) => {
    if (next < 1 || next > pages || next === page) return;
    e.preventDefault();
    onChange(next);
  };

  // Always first, last, and a window centred on the current page.
  const windowSize = 1;
  const pagesToShow = new Set<number>([1, pages]);
  for (
    let p = Math.max(2, page - windowSize);
    p <= Math.min(pages - 1, page + windowSize);
    p++
  ) {
    pagesToShow.add(p);
  }

  const ordered = [...pagesToShow].sort((a, b) => a - b);
  const withGaps: Array<number | "gap"> = [];
  ordered.forEach((p, i) => {
    if (i > 0 && p - (ordered[i - 1] as number) > 1) withGaps.push("gap");
    withGaps.push(p);
  });

  return (
    <Pagination className={cn("border-t pt-4", className)}>
      <PaginationContent className="flex-wrap gap-1">
        <PaginationItem>
          <PaginationPrevious
            href={hrefFor(Math.max(1, page - 1))}
            onClick={(e) => go(page - 1, e)}
            aria-disabled={page <= 1}
            className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
          />
        </PaginationItem>

        {withGaps.map((entry, i) =>
          entry === "gap" ? (
            <PaginationItem key={`gap-${i}`}>
              <span
                className="text-muted-foreground grid size-8 place-items-center"
                aria-hidden
              >
                …
              </span>
            </PaginationItem>
          ) : (
            <PaginationItem key={entry}>
              <PaginationLink
                href={hrefFor(entry)}
                onClick={(e) => go(entry, e)}
                isActive={entry === page}
                aria-label={`Page ${entry}`}
                className="tabular-nums"
              >
                {entry}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationNext
            href={hrefFor(Math.min(pages, page + 1))}
            onClick={(e) => go(page + 1, e)}
            aria-disabled={page >= pages}
            className={page >= pages ? "pointer-events-none opacity-50" : undefined}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
