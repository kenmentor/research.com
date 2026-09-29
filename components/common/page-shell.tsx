import { cn } from "@/lib/utils";

/**
 * Standard page container. The AppShell owns the outer width and rails;
 * this owns the vertical rhythm between a page's major regions so the
 * gap is identical on every surface instead of hand-tuned per page.
 */
export function PageShell({
  children,
  className,
  gap = "md",
}: {
  children: React.ReactNode;
  className?: string;
  gap?: "sm" | "md" | "lg";
}) {
  const gaps = {
    sm: "gap-3 sm:gap-4",
    md: "gap-4 sm:gap-5",
    lg: "gap-5 sm:gap-6",
  } as const;

  return (
    <div className={cn("flex min-w-0 flex-col", gaps[gap], className)}>
      {children}
    </div>
  );
}
