"use client";

import Link from "next/link";
import { MoreHorizontal, UserMinus } from "lucide-react";
import { ProfileAvatar } from "@/components/common/profile-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface NetworkRowProps {
  name: string;
  username: string;
  headline: string;
  initials: string;
  avatarUrl?: string;
  mutuals?: number;
  /** "invite" (Accept/Ignore), "suggestion" (Connect), "connection" (Message), "pending" (withdraw). */
  variant?: "invite" | "suggestion" | "connection" | "pending";
  onPrimary?: () => void;
  onSecondary?: () => void;
  onRemove?: () => void;
  busy?: boolean;
}

/**
 * My Network list row.
 *
 * The name and avatar link to the profile — previously the row was a dead
 * end, so the only route to a person you hadn't connected with was typing
 * their username into discover. Removal moved into an overflow menu: it
 * sat one tap from "Message" with no confirmation.
 */
export function NetworkRow({
  name,
  username,
  headline,
  initials,
  avatarUrl,
  mutuals = 0,
  variant = "suggestion",
  onPrimary,
  onSecondary,
  onRemove,
  busy = false,
}: NetworkRowProps) {
  return (
    <Card className="transition-shadow hover:shadow-elevated">
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Link href={`/in/${username}`} className="flex min-w-0 items-center gap-3">
          <ProfileAvatar
            src={avatarUrl}
            alt={name}
            initials={initials}
            className="size-11"
            fallbackClassName="text-sm font-medium"
          />
          <div className="min-w-0">
            <p className="font-heading hover:text-primary truncate text-[0.95rem] font-semibold transition-colors">
              {name}
            </p>
            <p className="text-muted-foreground truncate text-sm">{headline}</p>
            {mutuals > 0 && (
              <p className="text-muted-foreground/90 mt-0.5 text-xs">
                <span className="text-foreground font-medium tabular-nums">
                  {mutuals}
                </span>{" "}
                mutual{mutuals === 1 ? "" : "s"}
              </p>
            )}
          </div>
        </Link>

        <div className="flex shrink-0 gap-2 sm:ml-auto">
          {variant === "invite" && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={onSecondary}
                disabled={busy}
                className="flex-1 sm:flex-none"
              >
                Ignore
              </Button>
              <Button
                size="sm"
                onClick={onPrimary}
                disabled={busy}
                className="flex-1 sm:flex-none"
              >
                Accept
              </Button>
            </>
          )}
          {variant === "suggestion" && (
            <Button
              size="sm"
              variant="outline"
              onClick={onPrimary}
              disabled={busy}
              className="flex-1 sm:flex-none"
            >
              Connect
            </Button>
          )}
          {variant === "connection" && (
            <Button
              size="sm"
              variant="outline"
              onClick={onPrimary}
              disabled={busy}
              className="flex-1 sm:flex-none"
            >
              Message
            </Button>
          )}
          {variant === "pending" && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onPrimary}
              disabled={busy}
              className="flex-1 sm:flex-none"
            >
              Withdraw
            </Button>
          )}

          {onRemove && (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={`More options for ${name}`}
                render={
                  <Button variant="ghost" size="icon-sm">
                    <MoreHorizontal className="size-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onRemove}>
                  <UserMinus className="size-4" aria-hidden />
                  Remove connection
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
