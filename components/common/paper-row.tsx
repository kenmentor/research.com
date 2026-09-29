import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface PaperRowData {
  _id: string;
  title: string;
  authors?: Array<{ name: string } | string>;
  venue: string;
  year?: number;
  /** Not every feed returns tags (e.g. the topic endpoint). */
  tags?: string[];
  citationsCount: number;
  readsCount?: number;
  abstract?: string;
}

/** "Alvarez, Chen, Okafor" — tolerates both string and object authors. */
function authorNames(
  authors: PaperRowData["authors"],
): string[] | null {
  if (!authors?.length) return null;
  return authors.map((a) => (typeof a === "string" ? a : a.name));
}

/**
 * One publication in a list.
 *
 * Venue/year/citation counts are pulled onto a single meta line with
 * tabular figures so the numbers align down the column, and the title
 * gets the serif treatment used for names elsewhere in the product.
 */
export function PaperRow({
  paper,
  action,
  className,
  showAbstract = false,
  showTags = true,
}: {
  paper: PaperRowData;
  action?: React.ReactNode;
  className?: string;
  showAbstract?: boolean;
  showTags?: boolean;
}) {
  const authors = authorNames(paper.authors);
  const tags = paper.tags?.slice(0, 5) ?? [];

  return (
    <Card
      className={cn(
        "group/paper transition-shadow hover:shadow-elevated",
        className,
      )}
    >
      <CardContent className="flex flex-col gap-2 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Link
              href={`/pub/${paper._id}`}
              className="font-heading hover:text-primary text-[0.95rem] leading-snug font-semibold transition-colors"
            >
              {paper.title}
            </Link>

            {authors && (
              <p className="text-muted-foreground mt-1 line-clamp-1 text-sm">
                {authors.join(", ")}
              </p>
            )}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </div>

        <div className="text-muted-foreground/90 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
          {paper.venue && <span className="font-medium">{paper.venue}</span>}
          {paper.venue && paper.year && <span aria-hidden>·</span>}
          {paper.year && (
            <span className="tabular-nums">{paper.year}</span>
          )}
          <span aria-hidden>·</span>
          <span className="tabular-nums">
            {paper.citationsCount} {paper.citationsCount === 1 ? "citation" : "citations"}
          </span>
          {typeof paper.readsCount === "number" && (
            <>
              <span aria-hidden>·</span>
              <span className="tabular-nums">
                {paper.readsCount.toLocaleString()} reads
              </span>
            </>
          )}
        </div>

        {showAbstract && paper.abstract && (
          <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
            {paper.abstract}
          </p>
        )}

        {showTags && tags.length > 0 && (
          <ul className="mt-0.5 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <li key={tag}>
                <Link
                  href={`/topics/${encodeURIComponent(tag.toLowerCase())}`}
                  className="bg-brand-soft text-brand-soft-foreground hover:bg-accent inline-flex rounded-md px-2 py-0.5 text-[0.7rem] font-medium transition-colors"
                >
                  {tag}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
