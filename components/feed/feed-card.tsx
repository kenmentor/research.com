"use client";

import Link from "next/link";
import {
  Bookmark,
  FileText,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
} from "lucide-react";
import { ProfileAvatar } from "@/components/common/profile-avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface FeedCardProps {
  authorName: string;
  authorHeadline: string;
  authorInitials: string;
  authorUsername: string;
  authorAvatarUrl?: string;
  timeAgo: string;
  body: string;
  paperTitle?: string;
  paperVenue?: string;
  paperYear?: number;
  paperHref?: string;
  likes?: number;
  comments?: number;
  reposts?: number;
  liked?: boolean;
  saved?: boolean;
  commentsOpen?: boolean;
  onLike?: () => void;
  onSave?: () => void;
  onRepost?: () => void;
  onToggleComments?: () => void;
  onReport?: () => void;
  /** Rendered below the body (comment thread, repost preview). */
  children?: React.ReactNode;
}

/** Count that stays out of the way until it has a value. */
function Count({ value }: { value?: number }) {
  if (!value) return null;
  return <span className="tabular-nums">{value.toLocaleString()}</span>;
}

/**
 * Feed post.
 *
 * Rebuilt with a real type ramp — serif name, muted headline with the
 * timestamp inline rather than on its own line — and a footer that
 * reflects state (liked/saved/posted) through colour as well as fill.
 * The previous version hardcoded `mx-6` against the card's spacing
 * token, so it drifted the moment the token changed.
 */
export function FeedCard({
  authorName,
  authorHeadline,
  authorInitials,
  authorUsername,
  authorAvatarUrl,
  timeAgo,
  body,
  paperTitle,
  paperVenue,
  paperYear,
  paperHref,
  likes = 0,
  comments = 0,
  reposts = 0,
  liked = false,
  saved = false,
  commentsOpen = false,
  onLike,
  onSave,
  onRepost,
  onToggleComments,
  onReport,
  children,
}: FeedCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-elevated">
      <div className="flex items-start gap-3 px-4 pt-4">
        <Link href={`/in/${authorUsername}`} className="shrink-0" tabIndex={-1} aria-hidden>
          <ProfileAvatar
            src={authorAvatarUrl}
            alt={authorName}
            initials={authorInitials}
            className="size-11"
            fallbackClassName="text-sm font-medium"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/in/${authorUsername}`}
                className="font-heading hover:text-primary block truncate text-[0.95rem] leading-snug font-semibold transition-colors"
              >
                {authorName}
              </Link>
              <p className="text-muted-foreground flex items-baseline gap-1.5 text-xs">
                <span className="truncate">{authorHeadline}</span>
                <span aria-hidden>·</span>
                <time className="shrink-0 tabular-nums">{timeAgo}</time>
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Post options"
                render={
                  <Button variant="ghost" size="icon-sm" className="-mt-0.5 -mr-1 shrink-0">
                    <MoreHorizontal className="size-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(window.location.href);
                    } catch {
                      /* clipboard blocked */
                    }
                  }}
                >
                  Copy link
                </DropdownMenuItem>
                {onReport && (
                  <DropdownMenuItem onClick={onReport}>Report post</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="px-4 pt-3 pb-1 text-[0.925rem] leading-relaxed whitespace-pre-line">
        {body}
      </div>

      {paperTitle && (
        <Link
          href={paperHref ?? "#"}
          onClick={(e) => {
            if (!paperHref) e.preventDefault();
          }}
          className="bg-surface hover:bg-accent group mx-4 mb-1 flex items-start gap-3 rounded-lg p-3 transition-colors"
        >
          <FileText className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
          <span className="min-w-0">
            <span className="text-muted-foreground block text-[0.7rem] font-semibold tracking-wide uppercase">
              Attached paper
            </span>
            <span className="mt-0.5 block text-sm font-medium leading-snug">
              {paperTitle}
            </span>
            {paperVenue && (
              <span className="text-muted-foreground mt-0.5 block text-xs">
                {[paperVenue, paperYear].filter(Boolean).join(" · ")}
              </span>
            )}
          </span>
        </Link>
      )}

      <div className="border-border mt-2 flex items-center gap-1 border-t px-2 py-1.5">
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={liked}
          onClick={onLike}
          className={cn(
            "text-muted-foreground hover:text-foreground flex-1 gap-1.5",
            liked && "text-destructive hover:text-destructive",
          )}
        >
          <Heart className={cn("size-4", liked && "fill-current")} />
          <span className="hidden sm:inline">Like</span>
          <Count value={likes} />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          aria-expanded={commentsOpen}
          onClick={onToggleComments}
          className="text-muted-foreground hover:text-foreground flex-1 gap-1.5"
        >
          <MessageCircle className="size-4" />
          <span className="hidden sm:inline">Comment</span>
          <Count value={comments} />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onRepost}
          className="text-muted-foreground hover:text-foreground flex-1 gap-1.5"
        >
          <Repeat2 className="size-4" />
          <span className="hidden sm:inline">Repost</span>
          <Count value={reposts} />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          aria-pressed={saved}
          onClick={onSave}
          className={cn(
            "text-muted-foreground hover:text-foreground w-9 px-0",
            saved && "text-primary hover:text-primary",
          )}
        >
          <Bookmark className={cn("size-4", saved && "fill-current")} />
          <span className="sr-only">{saved ? "Remove from saved" : "Save post"}</span>
        </Button>
      </div>

      {children}
    </Card>
  );
}
