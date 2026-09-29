"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * The primary query field. Deliberately taller and visually heavier than
 * the secondary filters, so the difference between "what am I looking
 * for" and "narrow it down" is legible without labels.
 */
export function SearchField({
  value,
  onChange,
  placeholder,
  label,
  className,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  className?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className={cn("relative min-w-0 flex-1", className)}>
      <label htmlFor="filter-search" className="sr-only">
        {label}
      </label>
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        aria-hidden
      />
      <Input
        id="filter-search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 pr-9 pl-9"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="absolute top-1/2 right-1 -translate-y-1/2"
        >
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  );
}

/** A labelled secondary filter. Stacks label over control. */
export function FilterField({
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  const id = `filter-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className={cn("min-w-0 flex-1 sm:max-w-44", className)}>
      <label
        htmlFor={id}
        className="text-muted-foreground mb-1 block text-xs font-medium"
      >
        {label}
      </label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9"
      />
    </div>
  );
}

/**
 * Container for the search + filter row. Mobile stacks the filters into
 * a two-up grid; from `sm` they flow inline; the search field always
 * gets the full row on small screens.
 */
export function FilterBar({
  children,
  onClearAll,
  activeCount,
  className,
}: {
  children: React.ReactNode;
  onClearAll?: () => void;
  activeCount?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        {children}
        {onClearAll && activeCount ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-muted-foreground shrink-0 self-start sm:self-auto"
          >
            <X className="size-3.5" />
            Clear {activeCount} filter{activeCount === 1 ? "" : "s"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Result count + sort/page controls. Replaces the bare floating
 * `<p className="text-xs">N results</p>` that every list used to render.
 */
export function ResultsMeta({
  count,
  noun,
  nounPlural,
  children,
}: {
  count: number;
  noun: string;
  nounPlural?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-muted-foreground text-sm" role="status" aria-live="polite">
        {count > 0 ? (
          <>
            <span className="text-foreground font-semibold tabular-nums">{count}</span>{" "}
            {count === 1 ? noun : (nounPlural ?? `${noun}s`)}
          </>
        ) : (
          `No ${nounPlural ?? `${noun}s`}`
        )}
      </p>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
