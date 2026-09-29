import Link from "next/link";
import { Building2, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileAvatar } from "@/components/common/profile-avatar";
import { initialsOf } from "@/lib/profile";
import { cn } from "@/lib/utils";

export interface PersonRowData {
  _id: string;
  username: string;
  displayName: string;
  headline: string;
  affiliation: string;
  location?: string;
  interests: string[];
  avatarUrl?: string;
}

/**
 * One researcher in a list.
 *
 * The old rows were an avatar plus three truncated lines in a
 * full-bleed card, which left half the viewport empty on desktop and
 * dropped the interests the API had already fetched. This lays the
 * identity out left-to-right with meta on its own line and interests
 * as real chips.
 */
export function PersonRow({
  person,
  action,
  href,
  className,
  showInterests = true,
}: {
  person: PersonRowData;
  /** Trailing action, e.g. a Connect button. */
  action?: React.ReactNode;
  href?: string;
  className?: string;
  showInterests?: boolean;
}) {
  const target = href ?? `/in/${person.username}`;
  const interests = person.interests?.slice(0, 4) ?? [];

  return (
    <Card
      className={cn(
        "group/person transition-shadow hover:shadow-elevated",
        className,
      )}
    >
      <CardContent className="flex items-start gap-3.5 py-4">
        <ProfileAvatar
          src={person.avatarUrl}
          alt={person.displayName}
          initials={initialsOf(person.displayName)}
          className="size-12"
          fallbackClassName="text-sm font-medium"
        />

        <div className="min-w-0 flex-1">
          <Link
            href={target}
            className="font-heading hover:text-primary inline-flex items-center gap-1.5 text-[0.95rem] leading-snug font-semibold transition-colors"
          >
            <span className="truncate">{person.displayName}</span>
          </Link>

          {person.headline && (
            <p className="text-muted-foreground mt-0.5 line-clamp-2 text-sm leading-snug">
              {person.headline}
            </p>
          )}

          <div className="text-muted-foreground/90 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {person.affiliation && (
              <span className="inline-flex min-w-0 items-center gap-1">
                <Building2 className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{person.affiliation}</span>
              </span>
            )}
            {person.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5 shrink-0" aria-hidden />
                {person.location}
              </span>
            )}
          </div>

          {showInterests && interests.length > 0 && (
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {interests.map((interest) => (
                <li key={interest}>
                  <Link
                    href={`/topics/${encodeURIComponent(interest.toLowerCase())}`}
                    className="bg-brand-soft text-brand-soft-foreground hover:bg-accent inline-flex rounded-md px-2 py-0.5 text-[0.7rem] font-medium transition-colors"
                  >
                    {interest}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {action && (
          <div className="flex shrink-0 items-center gap-2 sm:self-center">
            {action}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
