"use client";

import { Building2, Check, Clock, MapPin, MoreHorizontal, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileAvatar } from "@/components/common/profile-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type ConnectionState =
  | "none"
  | "pending-sent"
  | "pending-received"
  | "connected";

export interface ProfileHeaderProps {
  displayName: string;
  headline: string;
  affiliation: string;
  location: string;
  initials: string;
  avatarUrl?: string;
  interests?: string[];
  verified?: boolean;
  connectionState?: ConnectionState;
  following?: boolean;
  blocked?: boolean;
  mutuals?: number;
  busy?: boolean;
  onConnect?: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
  onMessage?: () => void;
  onFollow?: () => void;
  onBlock?: () => void;
}

/**
 * Public identity header.
 *
 * Fixed here: an unconditional `affiliation} · {location}` join that
 * rendered a bare "·" for anyone missing either field, and an owner
 * view that showed a disabled "Connected" button — meaningless, since
 * you can't connect to yourself. Owners now get a settings action.
 */
export function ProfileHeader({
  displayName,
  headline,
  affiliation,
  location,
  initials,
  avatarUrl,
  interests,
  verified = false,
  connectionState = "none",
  following = false,
  blocked = false,
  mutuals = 0,
  busy = false,
  onConnect,
  onAccept,
  onDecline,
  onMessage,
  onFollow,
  onBlock,
}: ProfileHeaderProps) {
  const isOwner = connectionState === "connected" && !onConnect;
  const chips = (interests ?? []).slice(0, 5);

  return (
    <Card className="overflow-hidden">
      {/* Subtle brand-tinted cover. Decorative only — the identity
          block below is what carries meaning. */}
      <div
        className="from-primary/12 via-primary/6 h-28 bg-linear-to-br to-transparent sm:h-36"
        aria-hidden
      />

      <CardContent className="pt-0">
        <div className="flex flex-col gap-4">
          <ProfileAvatar
            src={avatarUrl}
            alt={displayName}
            initials={initials}
            className="border-card ring-border -mt-12 size-24 border-4 ring-1 sm:-mt-14 sm:size-28"
            fallbackClassName="font-heading text-2xl font-semibold"
          />

          {/* Identity. Meta items are omitted individually so a missing
              field never leaves a dangling separator. */}
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h1 className="font-heading text-2xl leading-tight font-semibold tracking-tight">
                {displayName}
              </h1>
              {verified && <Badge variant="secondary">Verified</Badge>}
            </div>

            {headline && (
              <p className="text-muted-foreground max-w-prose text-sm leading-relaxed">
                {headline}
              </p>
            )}

            <div className="text-muted-foreground/90 flex flex-wrap items-center gap-x-3.5 gap-y-1 pt-0.5 text-sm">
              {affiliation && (
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <Building2 className="size-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{affiliation}</span>
                </span>
              )}
              {location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0" aria-hidden />
                  {location}
                </span>
              )}
            </div>

            {mutuals > 0 && (
              <p className="text-muted-foreground pt-0.5 text-sm">
                <span className="text-foreground font-semibold tabular-nums">
                  {mutuals}
                </span>{" "}
                mutual connection{mutuals === 1 ? "" : "s"}
              </p>
            )}
          </div>

          {chips.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {chips.map((interest) => (
                <li
                  key={interest}
                  className="bg-brand-soft text-brand-soft-foreground rounded-md px-2 py-0.5 text-xs font-medium"
                >
                  {interest}
                </li>
              ))}
            </ul>
          )}

          {/* Actions. Primary first and always full-width on mobile so
              the tap target survives a 320px viewport. */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {isOwner ? (
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                render={<a href="/settings" />}
              >
                Edit profile
              </Button>
            ) : (
              <>
                {connectionState === "connected" ? (
                  <Button variant="secondary" disabled className="w-full sm:w-auto">
                    <Check className="size-4" /> Connected
                  </Button>
                ) : connectionState === "pending-sent" ? (
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={onConnect}
                    className="w-full sm:w-auto"
                  >
                    <Clock className="size-4" /> Pending
                  </Button>
                ) : connectionState === "pending-received" ? (
                  <>
                    <Button
                      disabled={busy}
                      onClick={onAccept}
                      className="w-full sm:w-auto"
                    >
                      <Check className="size-4" /> Accept
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={onDecline}
                      className="w-full sm:w-auto"
                    >
                      <X className="size-4" /> Ignore
                    </Button>
                  </>
                ) : (
                  <Button
                    disabled={busy}
                    onClick={onConnect}
                    className="w-full sm:w-auto"
                  >
                    <UserPlus className="size-4" /> Connect
                  </Button>
                )}

                {onMessage && (
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={onMessage}
                    className="w-full sm:w-auto"
                  >
                    Message
                  </Button>
                )}
                {onFollow && (
                  <Button
                    variant={following ? "secondary" : "ghost"}
                    disabled={busy}
                    aria-pressed={following}
                    onClick={onFollow}
                    className="w-full sm:w-auto"
                  >
                    {following ? "Following" : "Follow"}
                  </Button>
                )}
              </>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="More actions"
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={busy}
                    className="sm:ml-auto"
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(window.location.href);
                      toast.success("Profile link copied.");
                    } catch {
                      toast.error("Copy failed.");
                    }
                  }}
                >
                  Copy profile link
                </DropdownMenuItem>
                {!isOwner && (
                  <DropdownMenuItem
                    className={cn(blocked && "text-destructive")}
                    onClick={onBlock}
                  >
                    {blocked ? "Unblock" : "Block"}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
