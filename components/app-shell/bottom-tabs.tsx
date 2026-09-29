"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Home, MessagesSquare, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";

/** Mobile/tablet tab bar. Desktop (lg+) uses TopNav + SideNav instead. */
export function BottomTabs({
  unreadCount = 0,
  username,
}: {
  unreadCount?: number;
  username: string | null;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  const tabs = [
    { href: "/", label: "Home", icon: Home },
    { href: "/network", label: "Network", icon: Users },
    { href: "/discover", label: "Discover", icon: Compass },
    { href: "/messages", label: "Messages", icon: MessagesSquare, badge: unreadCount },
    // "Me" needs the real username; until onboarding completes there is
    // no profile to link to, so the slot is omitted rather than 404ing.
    ...(username
      ? [{ href: `/in/${username}`, label: "Me", icon: User, badge: 0 }]
      : []),
  ];

  return (
    <nav
      aria-label="Primary mobile"
      className="bg-card/90 supports-[backdrop-filter]:bg-card/75 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div
        className="mx-auto grid max-w-lg"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map(({ href, label, icon: Icon, badge }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "text-muted-foreground relative flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors",
                active && "text-primary",
              )}
            >
              <span className="relative">
                <Icon
                  className="size-5.5"
                  strokeWidth={active ? 2.25 : 1.75}
                />
                {badge ? (
                  <span className="bg-primary text-primary-foreground absolute -top-1.5 -right-2.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-semibold tabular-nums">
                    {badge > 9 ? "9+" : badge}
                  </span>
                ) : null}
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
