import { cn } from "@/lib/utils";

/**
 * The one place a page title is declared.
 *
 * Every surface used to invent its own `<h1 className="text-xl font-bold">`,
 * which is why hierarchy drifted page to page. This fixes the type ramp
 * once: eyebrow → serif title → supporting line → action slot.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  /** Buttons or a small control cluster, right-aligned on desktop. */
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        {eyebrow && (
          <p className="text-primary text-xs font-semibold tracking-wide uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="font-heading text-2xl leading-tight font-semibold tracking-tight sm:text-[1.75rem]">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground max-w-prose text-sm leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </header>
  );
}

/**
 * Section heading for stacked regions inside a page. Deliberately
 * smaller than PageHeader so the page keeps a single dominant h1.
 */
export function SectionHeading({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div className="min-w-0 space-y-0.5">
        <h2 className="font-heading text-base font-semibold">{title}</h2>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
