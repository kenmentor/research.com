"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export interface SubNavItem {
  href: string;
  label: string;
  count?: number;
}

/**
 * Section switcher for sibling routes (/discover/people ⇄ /discover/papers).
 *
 * These are separate pages, so they are real links with `aria-current`,
 * not tab panels. The old implementation used a `Tabs` with no
 * `TabsContent` whose triggers each called `router.push` — a tab list
 * whose active state was hardcoded, so the second tab could never
 * light up. Horizontally scrollable so the labels survive a 320px
 * viewport without wrapping mid-word.
 */
export function SubNav({
  items,
  className,
  preserveQuery = true,
}: {
  items: SubNavItem[];
  className?: string;
  /** Carry the current query string across the switch. */
  preserveQuery?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      aria-label="Section"
      className={cn(
        "no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1",
        className,
      )}
    >
      {items.map(({ href, label, count }) => {
        const active = isActive(href);
        // Carry the active query across so switching People ⇄ Papers
        // doesn't discard a half-typed search.
        const target = preserveQuery && query ? `${href}?${query}` : href;
        return (
          <Link
            key={href}
            href={target}
            aria-current={active ? "page" : undefined}
            className={cn(
              "text-muted-foreground hover:bg-accent hover:text-foreground inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active && "bg-accent text-foreground",
            )}
          >
            {label}
            {typeof count === "number" && count > 0 && (
              <span className="text-muted-foreground bg-muted rounded px-1.5 py-px text-xs tabular-nums">
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
