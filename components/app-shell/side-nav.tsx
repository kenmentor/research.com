"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Home, MessageSquare, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Destinations are limited to routes that exist. `/publications` and
 * `/saved` were never built — papers live on the profile and under
 * /discover, so linking them produced a 404 on every click.
 */
const ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/network", label: "My Network", icon: Users },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/messages", label: "Messages", icon: MessageSquare },
];

/** Desktop left rail. Hidden below lg (bottom tabs take over). */
export function SideNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Card className="overflow-hidden py-2">
      <CardContent className="p-0">
        <nav aria-label="Section">
          {ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground relative flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors",
                  active &&
                    "text-primary bg-sidebar-accent before:bg-primary before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full",
                )}
              >
                <Icon className="size-4.5" strokeWidth={active ? 2.25 : 1.75} />
                {label}
              </Link>
            );
          })}
        </nav>
      </CardContent>
    </Card>
  );
}
