import { AlertTriangle, Inbox } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Skeletons shaped like the rows they stand in for. The old ones were
 * flat `h-20` blocks, so the layout visibly jumped the moment data
 * arrived.
 */
export function ResultSkeleton({
  variant = "row",
  count = 4,
}: {
  variant?: "row" | "card";
  count?: number;
}) {
  if (variant === "card") {
    return (
      <div className="flex flex-col gap-3" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading results…</span>
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="gap-2 py-4">
            <CardContent className="flex flex-col gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading results…</span>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex items-center gap-3 py-3.5">
            <Skeleton className="size-11 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Skeleton shaped like `FeedCard` — avatar, two name lines, body copy,
 * and the action bar. The feed used a flat `h-36` block, so every card
 * grew as real text landed in it.
 */
export function PostSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading posts…</span>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="px-4 py-4">
            <div className="flex items-start gap-3">
              <Skeleton className="size-11 shrink-0 rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-11/12" />
              <Skeleton className="h-3.5 w-2/3" />
            </div>
          </CardContent>
          <div className="border-border flex gap-2 border-t px-4 py-3">
            <Skeleton className="size-6" />
            <Skeleton className="size-6" />
            <Skeleton className="size-6" />
            <Skeleton className="ml-auto size-6" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  secondaryAction,
  icon: Icon = Inbox,
  compact = false,
  className,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryAction?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  /** Drop the card chrome — for empty states nested inside a card. */
  compact?: boolean;
  className?: string;
}) {
  const body = (
    <div
      className={cn(
        "flex flex-col items-center gap-2 text-center",
        compact ? "py-6" : "py-12",
        className,
      )}
    >
      <span
        className="bg-muted text-muted-foreground mb-1 grid size-11 place-items-center rounded-full"
        aria-hidden
      >
        <Icon className="size-5" />
      </span>
      <p className="font-heading text-base font-semibold">{title}</p>
      <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
        {description}
      </p>
      {(actionLabel || secondaryAction) && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {actionLabel && onAction && (
            <Button onClick={onAction}>{actionLabel}</Button>
          )}
          {secondaryAction}
        </div>
      )}
    </div>
  );

  if (compact) return body;

  return (
    <Card>
      <CardContent className="p-0">{body}</CardContent>
    </Card>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this. Try again.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <Alert variant="destructive">
      <AlertTriangle aria-hidden />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center gap-2">
        {description}
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
