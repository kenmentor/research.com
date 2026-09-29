import Link from "next/link";
import { BadgeCheck, BookOpen, Eye, Quote, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PersonRow } from "@/components/common/person-row";
import { cn } from "@/lib/utils";

export interface RailProfile {
  username: string;
  displayName: string;
  headline: string;
}

const STAT_META = [
  { key: "connections", label: "Connections", icon: Users },
  { key: "followers", label: "Followers", icon: TrendingUp },
  { key: "citations", label: "Citations", icon: Quote },
  { key: "reads", label: "Paper reads", icon: BookOpen },
  { key: "views", label: "Profile views", icon: Eye },
] as const;

export function StatsRail({
  stats,
  completeness,
  suggestions,
  isOwner,
}: {
  stats: {
    connections: number;
    followers: number;
    citations: number;
    reads: number;
    views: number;
  };
  completeness?: { pct: number; missing: string[] };
  suggestions: RailProfile[];
  isOwner: boolean;
}) {
  const entries = STAT_META.map(({ key, label, icon: Icon }) => ({
    label,
    icon: Icon,
    value: stats[key],
  }));

  return (
    <div className="flex flex-col gap-4">
      {isOwner && completeness && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-baseline justify-between gap-2">
              <CardTitle className="text-sm">Profile strength</CardTitle>
              <span className="text-primary text-sm font-semibold tabular-nums">
                {completeness.pct}%
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={completeness.pct} aria-hidden />
            {completeness.missing.length > 0 ? (
              <ul className="text-muted-foreground space-y-1.5 text-sm">
                {completeness.missing.map((m) => (
                  <li key={m} className="flex items-start gap-1.5">
                    <span className="bg-muted-foreground/40 mt-1.5 size-1 shrink-0 rounded-full" aria-hidden />
                    {m}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-success flex items-center gap-1.5 text-sm font-medium">
                <BadgeCheck className="size-4" aria-hidden />
                Complete — looking sharp.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Impact</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Single column of rows rather than a 2-col grid: five
              metrics in a grid left an orphan on the last row, and
              label/value pairs read better aligned in a list. */}
          <dl className="divide-border divide-y">
            {entries.map(({ label, icon: Icon, value }) => (
              <div
                key={label}
                className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
              >
                <dt className="text-muted-foreground flex min-w-0 items-center gap-2 text-sm">
                  <Icon className="size-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{label}</span>
                </dt>
                <dd
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    value > 0 ? "text-foreground" : "text-muted-foreground/60",
                  )}
                >
                  {value.toLocaleString()}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {suggestions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Also working in this area</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {suggestions.map((s) => (
              <PersonRow
                key={s.username}
                person={{
                  _id: s.username,
                  username: s.username,
                  displayName: s.displayName,
                  headline: s.headline,
                  affiliation: "",
                  interests: [],
                }}
                showInterests={false}
                className="ring-1 hover:shadow-none"
                action={
                  <Link
                    href={`/in/${s.username}`}
                    className="text-primary text-sm font-medium hover:underline"
                  >
                    View
                  </Link>
                }
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
